"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";

type LoginFormProps = {
  authError?: string;
  googleClientId: string;
  initialRole: "customer" | "admin";
  returnTo: string;
};

type AuthMode = "login" | "register";

type AuthResponse = {
  error?: string;
  user?: {
    email: string;
    name: string;
    role: "customer" | "admin";
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              shape?: "pill" | "rectangular" | "circle" | "square";
              size?: "small" | "medium" | "large";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              theme?: "outline" | "filled_blue" | "filled_black";
              type?: "standard" | "icon";
            },
          ) => void;
        };
      };
    };
  }
}

export default function LoginForm({
  authError,
  googleClientId,
  initialRole,
  returnTo,
}: LoginFormProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(authError || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    let cancelled = false;

    async function handleCredential(credential: string | undefined) {
      if (!credential) {
        setMessage("Google did not return a sign-in credential.");
        return;
      }

      setIsSubmitting(true);
      setMessage("Verifying Google account...");

      try {
        const response = await fetch("/api/auth/google/credential", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential, role }),
        });
        const data = (await response.json()) as AuthResponse;

        if (!response.ok || data.error) {
          throw new Error(data.error || "Google sign-in failed.");
        }

        window.location.assign(returnTo);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Google sign-in failed.");
      } finally {
        setIsSubmitting(false);
      }
    }

    function renderGoogleButton() {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;

      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          void handleCredential(response.credential);
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        shape: "pill",
        size: "large",
        text: mode === "register" ? "signup_with" : "signin_with",
        theme: "outline",
        type: "standard",
      });
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = renderGoogleButton;
    script.onerror = () => setMessage("Google sign-in script could not be loaded.");
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [googleClientId, mode, returnTo, role]);

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(mode === "login" ? "Checking your account..." : "Creating your account...");

    try {
      const response = await fetch(
        mode === "login" ? "/api/auth/password/login" : "/api/auth/password/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name,
            password,
            role,
          }),
        },
      );
      const data = (await response.json()) as AuthResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error || "Sign-in failed.");
      }

      window.location.assign(returnTo);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fff9f7] px-4 py-8 text-[#2d2525] sm:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="max-w-xl">
          <Link className="text-sm font-semibold text-[#6e3038]" href="/">
            GlowNest
          </Link>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
            Sign in to manage your beauty bookings.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#665957]">
            Use your account to save requests, continue bookings, and access the admin dashboard
            when your email is approved.
          </p>
        </div>

        <div className="rounded-lg border border-[#eadbd6] bg-white p-5 shadow-[0_24px_70px_rgba(110,48,56,0.12)] sm:p-7">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#fff3ef] p-1">
            <button
              className={`h-11 rounded-md text-sm font-semibold ${
                mode === "login" ? "bg-white text-[#6e3038] shadow-sm" : "text-[#806a65]"
              }`}
              onClick={() => setMode("login")}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`h-11 rounded-md text-sm font-semibold ${
                mode === "register" ? "bg-white text-[#6e3038] shadow-sm" : "text-[#806a65]"
              }`}
              onClick={() => setMode("register")}
              type="button"
            >
              Create account
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              className={`h-11 rounded-lg border text-sm font-semibold ${
                role === "customer"
                  ? "border-[#6e3038] bg-[#6e3038] text-white"
                  : "border-[#eadbd6] bg-white text-[#6e3038]"
              }`}
              onClick={() => setRole("customer")}
              type="button"
            >
              Customer
            </button>
            <button
              className={`h-11 rounded-lg border text-sm font-semibold ${
                role === "admin"
                  ? "border-[#6e3038] bg-[#6e3038] text-white"
                  : "border-[#eadbd6] bg-white text-[#6e3038]"
              }`}
              onClick={() => setRole("admin")}
              type="button"
            >
              Admin
            </button>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={submitCredentials}>
            {mode === "register" && (
              <label className="block">
                <span className="text-sm font-semibold text-[#5e514f]">Full name</span>
                <input
                  autoComplete="name"
                  className="mt-2 h-12 w-full rounded-lg border border-[#eadbd6] px-3 outline-none focus:border-[#6e3038]"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                  value={name}
                />
              </label>
            )}

            {mode === "register" && role === "admin" && (
              <p className="rounded-lg bg-[#edf8f3] p-3 text-sm font-semibold text-[#356c5c]">
                Admin accounts can only be created with an email listed in ADMIN_EMAILS.
              </p>
            )}

            <label className="block">
              <span className="text-sm font-semibold text-[#5e514f]">Email</span>
              <input
                autoComplete="email"
                className="mt-2 h-12 w-full rounded-lg border border-[#eadbd6] px-3 outline-none focus:border-[#6e3038]"
                onChange={(event) => setEmail(event.target.value)}
                placeholder={role === "admin" ? "admin@example.com" : "you@example.com"}
                required
                type="email"
                value={email}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#5e514f]">Password</span>
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="mt-2 h-12 w-full rounded-lg border border-[#eadbd6] px-3 outline-none focus:border-[#6e3038]"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                type="password"
                value={password}
              />
            </label>

            {message && (
              <p className="rounded-lg bg-[#fff3ef] p-3 text-sm font-semibold text-[#8d4a55]">
                {message}
              </p>
            )}

            <button
              className="h-12 rounded-lg bg-[#2d2525] px-4 font-semibold text-white transition hover:bg-[#6e3038] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {googleClientId && (
            <div className="mt-6">
              <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7770]">
                <span className="h-px flex-1 bg-[#eadbd6]" />
                Or continue with Google
                <span className="h-px flex-1 bg-[#eadbd6]" />
              </div>
              <div className="flex min-h-11 justify-center" ref={googleButtonRef} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
