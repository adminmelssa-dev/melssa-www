"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/modules/auth/client";
import { AuthMessage } from "@/modules/auth/components/auth-message";
import { PasswordStrengthMeter } from "@/modules/auth/components/password-strength-meter";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is invalid or expired.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    const result = await authClient.resetPassword({ newPassword, token });

    if (result.error) {
      setError(result.error.message ?? "Password reset failed.");
      setIsSubmitting(false);
      return;
    }

    setIsSuccess(true);
    setIsSubmitting(false);
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-md bg-primary/10 text-primary">
          <CheckCircle2 className="size-7" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-black">Password updated</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            You can now sign in with your new password.
          </p>
        </div>
        <Button onClick={() => router.push("/sign-in")} className="w-full">
          Continue to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-black">Set new password</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choose a new password for your MELSSA portal account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!token ? (
          <AuthMessage variant="error">This reset link is invalid or expired.</AuthMessage>
        ) : null}
        {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={8}
            required
          />
        </div>

        <PasswordStrengthMeter password={newPassword} />

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
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

        <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
          <KeyRound className="size-4" />
          {isSubmitting ? "Updating..." : "Update password"}
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
