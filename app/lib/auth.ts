import crypto from "node:crypto";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { query } from "@/app/lib/postgres";

export type UserRole = "customer" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
};

export type AuthSession = {
  user: AuthUser;
  expiresAt: Date;
};

type GoogleTokenResponse = {
  id_token?: string;
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
};

type OAuthUserRow = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
};

type SessionRow = OAuthUserRow & {
  expires_at: Date;
};

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const SESSION_COOKIE_NAME = "glownest_session";
export const OAUTH_STATE_COOKIE_NAME = "glownest_oauth_state";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
export const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;

let authSchemaReady = false;

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value || value.includes("replace")) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function signOAuthState(state: string, role: UserRole, returnTo: string) {
  return crypto
    .createHmac("sha256", getRequiredEnv("AUTH_SECRET"))
    .update(`${state}|${role}|${returnTo}`)
    .digest("base64url");
}

function isEqualSignature(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookieHeader(cookieHeader: string | null) {
  const values = new Map<string, string>();

  for (const part of cookieHeader?.split(";") || []) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName || rawValue.length === 0) continue;
    values.set(rawName, decodeURIComponent(rawValue.join("=")));
  }

  return values;
}

function getAdminEmailSet() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function roleForEmail(email: string): UserRole {
  return getAdminEmailSet().has(email.toLowerCase()) ? "admin" : "customer";
}

function toAuthUser(row: OAuthUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    role: row.role,
  };
}

export function getGoogleOAuthConfig(origin?: string) {
  const clientId = getRequiredEnv("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = getRequiredEnv("GOOGLE_OAUTH_CLIENT_SECRET");
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ||
    `${origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/google/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function createOAuthState(role: UserRole, returnTo: string) {
  const state = randomToken(24);
  const signature = signOAuthState(state, role, returnTo);
  const encoded = Buffer.from(JSON.stringify({ state, role, returnTo, signature })).toString(
    "base64url",
  );

  return { state, cookieValue: encoded };
}

export function readOAuthState(cookieValue: string | undefined) {
  if (!cookieValue) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cookieValue, "base64url").toString("utf8")) as {
      state?: unknown;
      role?: unknown;
      returnTo?: unknown;
      signature?: unknown;
    };

    if (
      typeof parsed.state !== "string" ||
      (parsed.role !== "customer" && parsed.role !== "admin") ||
      typeof parsed.returnTo !== "string" ||
      typeof parsed.signature !== "string"
    ) {
      return null;
    }

    const returnTo = parsed.returnTo.startsWith("/") ? parsed.returnTo : "/";
    const expectedSignature = signOAuthState(parsed.state, parsed.role, returnTo);

    if (!isEqualSignature(parsed.signature, expectedSignature)) {
      return null;
    }

    return {
      state: parsed.state,
      role: parsed.role,
      returnTo,
    };
  } catch {
    return null;
  }
}

export function buildGoogleAuthorizationUrl(config: ReturnType<typeof getGoogleOAuthConfig>, state: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  return url;
}

export async function ensureAuthSchema() {
  if (authSchemaReady) return;

  await query(`
    CREATE TABLE IF NOT EXISTS oauth_users (
      id uuid PRIMARY KEY,
      provider text NOT NULL,
      provider_account_id text NOT NULL,
      email text NOT NULL,
      name text NOT NULL,
      avatar_url text,
      role text NOT NULL CHECK (role IN ('customer', 'admin')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (provider, provider_account_id),
      UNIQUE (email)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS oauth_sessions (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES oauth_users(id) ON DELETE CASCADE,
      session_token_hash text NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_seen_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await query("CREATE INDEX IF NOT EXISTS oauth_sessions_user_id_idx ON oauth_sessions(user_id)");
  await query("CREATE INDEX IF NOT EXISTS oauth_sessions_expires_at_idx ON oauth_sessions(expires_at)");
  await query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES oauth_users(id) ON DELETE SET NULL");
  await query("ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES oauth_users(id) ON DELETE SET NULL");

  authSchemaReady = true;
}

export async function exchangeGoogleCodeForProfile(code: string, origin: string) {
  const config = getGoogleOAuthConfig(origin);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
  });
  const token = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !token.id_token) {
    throw new Error(token.error_description || token.error || "Google sign-in failed.");
  }

  const { payload } = await jwtVerify(token.id_token, googleJwks, {
    audience: config.clientId,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
  });

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
  const emailVerified = payload.email_verified === true || payload.email_verified === "true";

  if (!payload.sub || !email || !emailVerified) {
    throw new Error("Google account must have a verified email address.");
  }

  return {
    sub: payload.sub,
    email,
    emailVerified,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email,
    picture: typeof payload.picture === "string" ? payload.picture : null,
  } satisfies GoogleProfile;
}

export async function upsertOAuthUser(profile: GoogleProfile) {
  await ensureAuthSchema();

  const role = roleForEmail(profile.email);
  const result = await query<OAuthUserRow>(
    `
      INSERT INTO oauth_users (
        id,
        provider,
        provider_account_id,
        email,
        name,
        avatar_url,
        role
      )
      VALUES ($1, 'google', $2, $3, $4, $5, $6)
      ON CONFLICT (provider, provider_account_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        role = CASE
          WHEN oauth_users.role = 'admin' THEN 'admin'
          ELSE EXCLUDED.role
        END,
        updated_at = now()
      RETURNING id, email, name, avatar_url, role
    `,
    [crypto.randomUUID(), profile.sub, profile.email, profile.name, profile.picture, role],
  );

  return toAuthUser(result.rows[0]);
}

export async function createSession(userId: string) {
  await ensureAuthSchema();

  const token = randomToken(48);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await query(
    `
      INSERT INTO oauth_sessions (id, user_id, session_token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [crypto.randomUUID(), userId, hashToken(token), expiresAt],
  );

  return { token, expiresAt };
}

export async function getSessionByToken(token: string | undefined) {
  if (!token) return null;
  await ensureAuthSchema();

  const result = await query<SessionRow>(
    `
      SELECT
        oauth_users.id,
        oauth_users.email,
        oauth_users.name,
        oauth_users.avatar_url,
        oauth_users.role,
        oauth_sessions.expires_at
      FROM oauth_sessions
      JOIN oauth_users ON oauth_users.id = oauth_sessions.user_id
      WHERE oauth_sessions.session_token_hash = $1
        AND oauth_sessions.expires_at > now()
      LIMIT 1
    `,
    [hashToken(token)],
  );
  const row = result.rows[0];

  if (!row) return null;

  await query(
    "UPDATE oauth_sessions SET last_seen_at = now() WHERE session_token_hash = $1",
    [hashToken(token)],
  );

  return {
    user: toAuthUser(row),
    expiresAt: row.expires_at,
  } satisfies AuthSession;
}

export async function getSessionFromRequest(request: Request) {
  const token = parseCookieHeader(request.headers.get("cookie")).get(SESSION_COOKIE_NAME);
  return getSessionByToken(token);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  return getSessionByToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function deleteSessionByToken(token: string | undefined) {
  if (!token) return;
  await ensureAuthSchema();
  await query("DELETE FROM oauth_sessions WHERE session_token_hash = $1", [hashToken(token)]);
}

export function getSessionCookieOptions(expiresAt: Date) {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}
