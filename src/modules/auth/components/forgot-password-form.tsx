"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/modules/auth/client";
import { AuthMessage } from "@/modules/auth/components/auth-message";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    if (result.error) {
      setError(result.error.message ?? "Password reset email failed.");
      setIsSubmitting(false);
      return;
    }

    setIsSent(true);
    setIsSubmitting(false);
  }

  if (isSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Mail className="size-7" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-black">Check your email</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            If an account exists for that address, a reset link is on the way.
          </p>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/sign-in">
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-black">Reset password</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter your email address and we will send a password reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <Mail className="size-4" />
          {isSubmitting ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
