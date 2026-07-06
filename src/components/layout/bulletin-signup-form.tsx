"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { actionResultSchema } from "@/lib/action-result";

export function BulletinSignupForm() {
  const [email, setEmail] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createClientIdempotencyKey(),
  );
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setStatus("idle");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bulletin/subscribe", {
        body: JSON.stringify({ email, source: "footer" }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        method: "POST",
      });
      const body: unknown = await response.json();
      const result = actionResultSchema.parse(body);

      setMessage(result.message);
      setStatus(result.ok && response.ok ? "success" : "error");

      if (result.ok && response.ok) {
        setEmail("");
        setIdempotencyKey(createClientIdempotencyKey());
      }
    } catch {
      setMessage("Subscription failed.");
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-4">
      <form
        className="flex items-center gap-2 border-b border-cream/20 pb-2.5"
        onSubmit={handleSubmit}
      >
        <input
          type="email"
          placeholder="your.email@atu.edu.gh"
          aria-label="Email address"
          className="min-w-0 flex-1 bg-transparent text-sm text-cream outline-none placeholder:text-cream/40"
          disabled={isSubmitting}
          onChange={(event) => setEmail(event.target.value)}
          value={email}
          required
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className="text-gold-bright transition-transform hover:translate-x-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
        </button>
      </form>
      <p
        className={
          status === "error"
            ? "mt-2 min-h-5 text-xs text-red-200"
            : "mt-2 min-h-5 text-xs text-cream/50"
        }
        role={status === "idle" ? undefined : "status"}
      >
        {message}
      </p>
    </div>
  );
}

function createClientIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
