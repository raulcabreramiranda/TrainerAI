import { NextResponse, type NextRequest } from "next/server";
import { normalizeProvider, getAuthUrlConfig } from "@/lib/oauth";
import { ApiError } from "@/lib/api/errors";
import { toErrorResponse } from "@/lib/api/server";
export const dynamic = "force-dynamic";

const STATE_COOKIE = "mm_oauth_state";

export async function GET(req: NextRequest, context: { params: { provider: string } }) {
  try {
    const provider = normalizeProvider(context.params.provider);
    if (!provider) {
      throw new ApiError("unsupported_provider", "Unsupported provider.", 400);
    }

    const config = getAuthUrlConfig(provider);
    if (!config.clientId) {
      const redirectUrl = new URL("/login", req.nextUrl.origin);
      redirectUrl.searchParams.set("error", "oauth_unconfigured");
      return NextResponse.redirect(redirectUrl);
    }

    const state = crypto.randomUUID();

    const redirectUri = `${req.nextUrl.origin}/api/auth/oauth/${provider}/callback`;
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set("client_id", config.clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", config.scope);
    authUrl.searchParams.set("state", state);

    if (provider === "google") {
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
    }

    const res = NextResponse.redirect(authUrl.toString());
    res.cookies.set({
      name: STATE_COOKIE,
      value: state,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10
    });
    return res;
  } catch (error) {
    return toErrorResponse(error);
  }
}


