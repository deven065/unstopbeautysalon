import { NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  buildGoogleAuthorizationUrl,
  createOAuthState,
  getGoogleOAuthConfig,
  type UserRole,
} from "@/app/lib/auth";

export const runtime = "nodejs";

function getRole(value: string | null): UserRole {
  return value === "admin" ? "admin" : "customer";
}

function getSafeReturnTo(value: string | null, role: UserRole) {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  return role === "admin" ? "/admin" : "/";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const role = getRole(requestUrl.searchParams.get("role"));
  const returnTo = getSafeReturnTo(requestUrl.searchParams.get("returnTo"), role);

  try {
    const config = getGoogleOAuthConfig(requestUrl.origin);
    const oauthState = createOAuthState(role, returnTo);
    const response = NextResponse.redirect(buildGoogleAuthorizationUrl(config, oauthState.state));

    response.cookies.set({
      name: OAUTH_STATE_COOKIE_NAME,
      value: oauthState.cookieValue,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth is not configured.";
    const errorUrl = new URL("/", requestUrl.origin);
    errorUrl.searchParams.set("authError", message);

    return NextResponse.redirect(errorUrl);
  }
}
