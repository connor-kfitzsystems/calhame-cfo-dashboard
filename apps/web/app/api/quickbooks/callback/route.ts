import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { pool } from "@/lib/db";
import { storeCompany } from "@/lib/queries/quickbooks/store-company";
import { getCompanyName } from "@/lib/queries/quickbooks/get-company-name";
import { storeAccountingConnection } from "@/lib/queries/store-accounting-connection";
import { storeCompanyMembership } from "@/lib/queries/store-company-membership";
import { getUserByClerkId } from "@/lib/queries/users/get-user-by-clerk-id";
import { accountingQueue } from "@/lib/accounting-queue";
import { SYNC_COMPANY_JOB } from "@repo/shared";
import { getIdByDisplayName } from "@/lib/queries/providers/get-id-by-display-name";
import { storeSyncState } from "@/lib/queries/provider-sync-state/store-sync-state";

const clientId = process.env.QUICKBOOKS_CLIENT_ID!;
const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET!;
const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI!;

export async function GET(req: NextRequest) {

  const { searchParams } = new URL(req.url);

  const { userId: clerkId } = await auth();

  const cookieStore = await cookies()

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = cookieStore.get("qb_oauth_state")?.value;
  const realmId = searchParams.get("realmId");

  if (!code) {
    return Response.json({ error: { message: "Missing authorization code" } }, { status: 400 });
  }

  if (!state || !storedState || state !== storedState) {
    cookieStore.delete("qb_oauth_state");
    return Response.json({ error: { message: "Invalid state" } }, { status: 400 });
  }

  if (!realmId) {
    return Response.json({ error: { message: "Missing realmId" } }, { status: 400 });
  }
  
  if (!clerkId) {
    return Response.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  cookieStore.delete("qb_oauth_state");

  try {
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Missing QuickBooks OAuth environment variables");
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri
    });

    const response = await fetch(
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token exchange failed:", errorText);
      return Response.json(
        { error: { message: "Failed to exchange code for tokens" } },
        { status: 500 }
      );
    }

    const data = await response.json();

    const accessTokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
    const refreshTokenExpiresAt = new Date(Date.now() + data.x_refresh_token_expires_in * 1000);

    const companyName = await getCompanyName(realmId, data.access_token);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const userResult = await getUserByClerkId(clerkId, client);
      const userId = userResult[0].id;

      const providerId = await getIdByDisplayName("quickbooks", client);
      const company = await storeCompany(realmId, companyName, providerId, client);
      await storeCompanyMembership(userId, company.id, "member", client);

      const accountingConnection = await storeAccountingConnection(
        company.id, data.access_token, data.refresh_token,
        accessTokenExpiresAt, refreshTokenExpiresAt, client
      );

      await storeSyncState(accountingConnection.id, "accounting", client);

      if (!company.id || !providerId) {
        return new Response(JSON.stringify({ error: { message: 'Missing parameters' } }), { status: 400 });
      }
    
      await accountingQueue.add(SYNC_COMPANY_JOB, { companyId: company.id, provider: "quickbooks" });

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    
    const { origin } = new URL(req.url);
    const redirectUrl = `${origin}/dashboard/connect`;

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Callback error:", error);
    return Response.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}
