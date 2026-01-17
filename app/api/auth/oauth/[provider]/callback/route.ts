import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDb } from "@/lib/db";
import { signJwt, setAuthCookie } from "@/lib/auth";
import { normalizeProvider, getAuthUrlConfig, type OAuthProvider } from "@/lib/oauth";
import { User } from "@/models/User";
import { UserProfile } from "@/models/UserProfile";
import { Settings } from "@/models/Settings";

const STATE_COOKIE = "mm_oauth_state";

type OAuthProfile = {
  id: string;
  email: string;
  name?: string;
};

async function exchangeGoogle(code: string, redirectUri: string) {
  const config = getAuthUrlConfig("google");
  if (!config.clientId || !config.clientSecret) {
    throw new Error("OAuth not configured");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!res.ok) {
    throw new Error("OAuth token exchange failed");
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("OAuth token missing");
  }

  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${data.access_token}` }
  });

  if (!profileRes.ok) {
    throw new Error("OAuth profile fetch failed");
  }

  const profile = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    name?: string;
  };

  if (!profile.sub || !profile.email) {
    throw new Error("OAuth profile missing email");
  }

  return { id: profile.sub, email: profile.email, name: profile.name } satisfies OAuthProfile;
}

async function exchangeFacebook(code: string, redirectUri: string) {
  const config = getAuthUrlConfig("facebook");
  if (!config.clientId || !config.clientSecret) {
    throw new Error("OAuth not configured");
  }

  const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", config.clientId);
  tokenUrl.searchParams.set("client_secret", config.clientSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl.toString());
  if (!tokenRes.ok) {
    throw new Error("OAuth token exchange failed");
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("OAuth token missing");
  }

  const profileUrl = new URL("https://graph.facebook.com/me");
  profileUrl.searchParams.set("fields", "id,name,email");
  profileUrl.searchParams.set("access_token", tokenData.access_token);

  const profileRes = await fetch(profileUrl.toString());
  if (!profileRes.ok) {
    throw new Error("OAuth profile fetch failed");
  }

  const profile = (await profileRes.json()) as { id?: string; email?: string; name?: string };
  if (!profile.id || !profile.email) {
    throw new Error("OAuth profile missing email");
  }

  return { id: profile.id, email: profile.email, name: profile.name } satisfies OAuthProfile;
}

async function exchangeApple() {
  throw new Error("OAuth not configured");
}

async function getProfile(provider: OAuthProvider, code: string, redirectUri: string) {
  if (provider === "google") {
    return exchangeGoogle(code, redirectUri);
  }
  if (provider === "facebook") {
    return exchangeFacebook(code, redirectUri);
  }
  return exchangeApple();
}

export async function GET(req: NextRequest, context: { params: { provider: string } }) {
  const provider = normalizeProvider(context.params.provider);
  if (!provider) {
    const redirectUrl = new URL("/login", req.nextUrl.origin);
    redirectUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(redirectUrl);
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = cookies().get(STATE_COOKIE)?.value;

  if (!code || !state || !storedState || storedState !== state) {
    const redirectUrl = new URL("/login", req.nextUrl.origin);
    redirectUrl.searchParams.set("error", "oauth");
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set({
      name: STATE_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    });
    return res;
  }
  const clearStateCookie = {
    name: STATE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };

  try {
    const redirectUri = `${req.nextUrl.origin}/api/auth/oauth/${provider}/callback`;
    const profile = await getProfile(provider, code, redirectUri);

    await connectDb();

    const email = profile.email.toLowerCase();
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name: profile.name,
        provider,
        providerId: profile.id
      });

      await UserProfile.create({
        userId: user._id,
        goal: "general fitness",
        experienceLevel: "beginner",
        daysPerWeek: 3
      });

      await Settings.create({
        userId: user._id,
        language: "en"
      });
    } else {
      if (user.provider !== "credentials" && user.provider !== provider) {
        const redirectUrl = new URL("/login", req.nextUrl.origin);
        redirectUrl.searchParams.set("error", "provider_mismatch");
        const res = NextResponse.redirect(redirectUrl);
        res.cookies.set(clearStateCookie);
        return res;
      }

      user.provider = provider;
      user.providerId = profile.id;
      if (!user.name && profile.name) {
        user.name = profile.name;
      }
      await user.save();
    }

    const token = signJwt({ userId: String(user._id) });
    const res = NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    setAuthCookie(res, token);
    res.cookies.set(clearStateCookie);
    return res;
  } catch (error) {
    console.error("OAuth callback error", error);
    const redirectUrl = new URL("/login", req.nextUrl.origin);
    if (error instanceof Error && error.message === "OAuth not configured") {
      redirectUrl.searchParams.set("error", "oauth_unconfigured");
    } else if (error instanceof Error && error.message === "OAuth profile missing email") {
      redirectUrl.searchParams.set("error", "oauth_email");
    } else {
      redirectUrl.searchParams.set("error", "oauth");
    }
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set(clearStateCookie);
    return res;
  }
}
