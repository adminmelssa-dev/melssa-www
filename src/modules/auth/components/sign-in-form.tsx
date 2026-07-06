"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAuthPageHref,
  normalizeAuthCallbackURL,
} from "@/modules/auth/callback-url";
import { authClient } from "@/modules/auth/client";
import { AuthMessage } from "@/modules/auth/components/auth-message";

function passkeysAreAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "PublicKeyCredential" in window
  );
}

interface SignInFormProps {
  callbackURL?: string;
}

export function SignInForm({ callbackURL = "/dashboard" }: SignInFormProps) {
  const router = useRouter();
  const nextURL = normalizeAuthCallbackURL(callbackURL);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasskeySubmitting, setIsPasskeySubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: nextURL,
      rememberMe,
    });

    if (result.error) {
      setError(result.error.message ?? "Sign in failed.");
      setIsSubmitting(false);
      return;
    }

    router.push(nextURL);
    router.refresh();
  }

  async function handlePasskeySignIn() {
    if (!passkeysAreAvailable()) {
      setError("This browser does not support passkey sign in.");
      return;
    }

    setError("");
    setIsPasskeySubmitting(true);

    try {
      const result = await authClient.signIn.passkey();

      if (result.error) {
        setError(result.error.message ?? "Passkey sign in failed.");
        setIsPasskeySubmitting(false);
        return;
      }

      router.push(nextURL);
      router.refresh();
    } catch {
      setError("Passkey sign in was cancelled.");
      setIsPasskeySubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-black">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Access resources, announcements, events, and student support tools.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username webauthn"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          Keep me signed in
        </label>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <LogIn className="size-4" />
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handlePasskeySignIn}
          disabled={isPasskeySubmitting}
        >
          <KeyRound className="size-4" />
          {isPasskeySubmitting ? "Waiting for passkey..." : "Use passkey"}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <Link
          href={getAuthPageHref("/sign-up", nextURL)}
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
