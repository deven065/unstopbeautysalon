import { NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createSession,
  exchangeGoogleCodeForProfile,
  getSessionCookieOptions,
  readOAuthState,
  upsertOAuthUser,
} from "@/app/lib/auth";

export const runtime = "nodejs";

function redirectWithError(origin: string, message: string) {
  const url = new URL("/", origin);
  url.searchParams.set("authError", message);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieHeader = request.headers.get("cookie") || "";
  const stateCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${OAUTH_STATE_COOKIE_NAME}=`))
    ?.slice(OAUTH_STATE_COOKIE_NAME.length + 1);
  const oauthState = readOAuthState(stateCookie ? decodeURIComponent(stateCookie) : undefined);

  if (!code || !state || !oauthState || oauthState.state !== state) {
    return redirectWithError(requestUrl.origin, "Invalid or expired OAuth state.");
  }

  try {
    const profile = await exchangeGoogleCodeForProfile(code, requestUrl.origin);
    const user = await upsertOAuthUser(profile);

    if (oauthState.role === "admin" && user.role !== "admin") {
      const deniedUrl = new URL("/", requestUrl.origin);
      deniedUrl.searchParams.set("authError", "This Google account is not allowed as an admin.");
      const response = NextResponse.redirect(deniedUrl);
      response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
      return response;
    }

    const session = await createSession(user.id);
    const response = NextResponse.redirect(new URL(oauthState.returnTo, requestUrl.origin));

    response.cookies.set({
      ...getSessionCookieOptions(session.expiresAt),
      name: SESSION_COOKIE_NAME,
      value: session.token,
    });
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google sign-in failed.";
    const response = redirectWithError(requestUrl.origin, message);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return response;
  }
}
