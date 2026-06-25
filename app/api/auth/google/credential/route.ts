import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  createSession,
  getSessionCookieOptions,
  upsertOAuthUser,
  verifyGoogleCredential,
  type UserRole,
} from "@/app/lib/auth";

export const runtime = "nodejs";

type CredentialRequest = {
  credential?: string;
  role?: UserRole;
};

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function getRequestedRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "customer";
}

export async function POST(request: Request) {
  let body: CredentialRequest;

  try {
    body = (await request.json()) as CredentialRequest;
  } catch {
    return jsonError("Invalid Google sign-in request.", 400);
  }

  try {
    const requestedRole = getRequestedRole(body.role);
    const profile = await verifyGoogleCredential(body.credential || "");
    const user = await upsertOAuthUser(profile);

    if (requestedRole === "admin" && user.role !== "admin") {
      return jsonError("This Google account is not allowed as an admin.", 403);
    }

    const session = await createSession(user.id);
    const response = NextResponse.json({ user });

    response.cookies.set({
      ...getSessionCookieOptions(session.expiresAt),
      name: SESSION_COOKIE_NAME,
      value: session.token,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google sign-in failed.";
    return jsonError(message, 401);
  }
}
