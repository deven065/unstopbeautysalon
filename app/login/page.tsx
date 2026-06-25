import { redirect } from "next/navigation";
import { getCurrentSession } from "@/app/lib/auth";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    authError?: string | string[];
    returnTo?: string | string[];
    role?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeReturnTo(value: string | undefined) {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

function safeRole(value: string | undefined): "customer" | "admin" {
  return value === "admin" ? "admin" : "customer";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, params] = await Promise.all([getCurrentSession(), searchParams]);
  const returnTo = safeReturnTo(firstParam(params.returnTo));
  const role = safeRole(firstParam(params.role));

  if (session) {
    redirect(returnTo);
  }

  return (
    <LoginForm
      authError={firstParam(params.authError)}
      googleClientId={process.env.GOOGLE_OAUTH_CLIENT_ID || ""}
      initialRole={role}
      returnTo={returnTo}
    />
  );
}
