import { intuitAuthScope } from "@/lib/constants";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const clientId = process.env.QUICKBOOKS_CLIENT_ID!;
const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI!;

export async function GET() {
  try {
    if (!clientId || !redirectUri) {
      throw new Error("Missing QuickBooks OAuth env variables");
    }

    const state = randomBytes(16).toString("hex");

    const cookieStore = await cookies()

    cookieStore.set("qb_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10
    });

    const authUrl = new URL("https://appcenter.intuit.com/connect/oauth2");

    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", intuitAuthScope);
    authUrl.searchParams.set("state", state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error in QuickBooks OAuth setup:", error);
    return new Response(JSON.stringify({ error: { message: "Internal Server Error" } }), { status: 500 });
  }
}
