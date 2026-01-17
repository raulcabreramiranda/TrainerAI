export type OAuthProvider = "google" | "facebook" | "apple";

type AuthUrlConfig = {
  authUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
};

export function normalizeProvider(value?: string | null): OAuthProvider | null {
  if (value === "google" || value === "facebook" || value === "apple") {
    return value;
  }
  return null;
}

export function getAuthUrlConfig(provider: OAuthProvider): AuthUrlConfig {
  if (provider === "google") {
    return {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      scope: "openid email profile",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    };
  }

  if (provider === "facebook") {
    return {
      authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
      scope: "email public_profile",
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET
    };
  }

  return {
    authUrl: "https://appleid.apple.com/auth/authorize",
    scope: "name email",
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET
  };
}
