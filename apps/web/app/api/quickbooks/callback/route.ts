import upsertAccountingConnection from "@/lib/queries/accouting-connections/upsert";
import upsertCompanyMembership from "@/lib/queries/company-memberships/upsert";
import upsertSyncState from "@/lib/queries/provider-sync-state/upsert";
import getUserByClerkId from "@/lib/queries/users/clerk-id/get";
import upsertCompany from "@/lib/queries/companies/upsert";
import getProviderByDisplayName from "@/lib/queries/providers/display-name/get";
import getCompanyName from "@/lib/queries/quickbooks/company-name/get";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { pool } from "@/lib/db";
import { accountingQueue } from "@/lib/accounting-queue";
import { ENTITIES, SYNC_COMPANY_JOB } from "@repo/shared";

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

    const [companyName, client] = await Promise.all([
      getCompanyName(realmId, data.access_token),
      pool.connect()
    ]);

    try {
      await client.query("BEGIN");

      const [userResult, provider] = await Promise.all([
        getUserByClerkId(clerkId, client),
        getProviderByDisplayName("quickbooks", client)
      ]);
      
      const userId = userResult.id;
      const company = await upsertCompany(realmId, companyName, provider.id, client);
      await upsertCompanyMembership(userId, company.id, "member", client);

      const accountingConnection = await upsertAccountingConnection(
        company.id, data.access_token, data.refresh_token,
        accessTokenExpiresAt, refreshTokenExpiresAt, client
      );

      for (const entity of ENTITIES) {
        await upsertSyncState(accountingConnection.id, entity, client);
      }

      if (!company.id || !provider.id) {
        return new Response(JSON.stringify({ error: { message: 'Missing parameters' } }), { status: 400 });
      }
    
      await accountingQueue.add(SYNC_COMPANY_JOB, { companyId: company.id, provider: "quickbooks", entities: ENTITIES }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000
        }
      });

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
