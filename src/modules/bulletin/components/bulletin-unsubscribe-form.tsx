"use client";

import { useState } from "react";
import { MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actionResultSchema } from "@/lib/action-result";

interface BulletinUnsubscribeFormProps {
  token: string;
}

export function BulletinUnsubscribeForm({
  token,
}: BulletinUnsubscribeFormProps) {
  const [message, setMessage] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function unsubscribe(): Promise<void> {
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bulletin/unsubscribe", {
        body: JSON.stringify({ token }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body: unknown = await response.json();
      const result = actionResultSchema.parse(body);

      setMessage(result.message);
      setIsDone(result.ok && response.ok);
    } catch {
      setMessage("Unsubscribe failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        disabled={isSubmitting || isDone}
        onClick={() => {
          void unsubscribe();
        }}
      >
        <MailX className="size-4" />
        {isSubmitting ? "Unsubscribing..." : "Unsubscribe"}
      </Button>
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
