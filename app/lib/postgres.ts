import { Pool, type QueryResultRow } from "pg";

declare global {
  var __glownestPgPool: Pool | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (process.env.VERCEL && /(?:localhost|127\.0\.0\.1|\[?::1\]?)/i.test(databaseUrl)) {
    throw new Error(
      "DATABASE_URL points to a local database. Configure a cloud Postgres DATABASE_URL in Vercel.",
    );
  }

  return databaseUrl;
}

export function getDatabaseSetupIssue() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return "DATABASE_URL is missing in the deployment environment.";
  }

  if (process.env.VERCEL && /(?:localhost|127\.0\.0\.1|\[?::1\]?)/i.test(databaseUrl)) {
    return "DATABASE_URL points to localhost. Vercel needs a cloud Postgres connection string.";
  }

  return "";
}

export function getPool() {
  globalThis.__glownestPgPool ??= new Pool({
    connectionString: getDatabaseUrl(),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  return globalThis.__glownestPgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  return getPool().query<T>(text, values);
}
