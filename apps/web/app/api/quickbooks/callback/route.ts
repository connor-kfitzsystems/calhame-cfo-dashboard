import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { pool } from "@/lib/db";
import { storeCompany } from "@/lib/queries/quickbooks/store-company";
import { getCompanyName } from "@/lib/queries/quickbooks/get-company-name";
import { storeAccountingConnection } from "@/lib/queries/store-accounting-connection";
import { storeCompanyMembership } from "@/lib/queries/store-company-membership";

const clientId = process.env.QUICKBOOKS_CLIENT_ID!;
const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET!;
const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI!;

export async function GET(req: NextRequest) {

  const { searchParams } = new URL(req.url);

  const { userId: clerkUserId } = await auth();

  const cookieStore = await cookies()

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = cookieStore.get("qb_oauth_state")?.value;
  const realmId = searchParams.get("realmId");

  if (!code) {
    return Response.json({ error: "Missing authorization code" }, { status: 400 });
  }

  if (!state || !storedState || state !== storedState) {
    return Response.json({ error: "Invalid state" }, { status: 400 });
  }

  if (!realmId) {
    return Response.json({ error: "Missing realmId" }, { status: 400 });
  }
  
  if (!clerkUserId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  cookieStore.delete("qb_oauth_state");

  try {
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
        { error: "Failed to exchange code for tokens" },
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

      const company = await storeCompany(realmId, companyName, "quickbooks", client);
      await storeCompanyMembership(clerkUserId, company.id, "member", client);
      await storeAccountingConnection(
        company.id, data.access_token, data.refresh_token,
        accessTokenExpiresAt, refreshTokenExpiresAt, client
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    
    return Response.redirect(
      "http://localhost:3000/dashboard/connect",
      302
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Callback error:", message, err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
