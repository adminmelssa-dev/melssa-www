"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileField } from "@/components/security/turnstile-field";
import {
  getAuthPageHref,
  normalizeAuthCallbackURL,
} from "@/modules/auth/callback-url";
import { authClient } from "@/modules/auth/client";
import { AuthMessage } from "@/modules/auth/components/auth-message";
import { PasswordStrengthMeter } from "@/modules/auth/components/password-strength-meter";

interface SignUpFormProps {
  callbackURL?: string;
  turnstileSiteKey: string | null;
}

export function SignUpForm({
  callbackURL = "/dashboard",
  turnstileSiteKey,
}: SignUpFormProps) {
  const router = useRouter();
  const nextURL = normalizeAuthCallbackURL(callbackURL);
  const turnstileEnabled = turnstileSiteKey !== null;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleTurnstileTokenChange = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (turnstileEnabled && turnstileToken.length === 0) {
      setError("Complete the security check before creating your account.");
      return;
    }

    setIsSubmitting(true);

    const signUpInput = {
      name,
      email,
      password,
      callbackURL: nextURL,
    };

    const result = turnstileEnabled
      ? await authClient.signUp.email(signUpInput, {
          headers: { "x-captcha-response": turnstileToken },
        })
      : await authClient.signUp.email(signUpInput);

    if (result.error) {
      setError(result.error.message ?? "Account creation failed.");
      setIsSubmitting(false);
      if (turnstileEnabled) {
        setTurnstileResetSignal((value) => value + 1);
      }
      return;
    }

    if (result.data?.token) {
      router.push(nextURL);
      router.refresh();
      return;
    }

    router.push("/verify-email");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-black">Create account</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Register for the MELSSA portal with your student details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>
        </div>

        <PasswordStrengthMeter password={password} />

        {turnstileEnabled ? (
          <TurnstileField
            action="signup"
            onTokenChange={handleTurnstileTokenChange}
            resetSignal={turnstileResetSignal}
            siteKey={turnstileSiteKey}
          />
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <UserPlus className="size-4" />
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link
          href={getAuthPageHref("/sign-in", nextURL)}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
