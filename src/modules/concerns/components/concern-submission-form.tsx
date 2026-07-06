"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TurnstileField } from "@/components/security/turnstile-field";
import {
  CONCERN_CATEGORY_OPTIONS,
  concernCategorySchema,
  createConcernInputSchema,
  type ConcernCategory,
  type CreateConcernInput,
} from "@/modules/concerns/contracts";
import { actionResultSchema, type ActionResult } from "@/lib/action-result";

interface ConcernSubmissionFormProps {
  turnstileSiteKey: string | null;
}

interface ConcernSubmissionValues {
  category: ConcernCategory;
  subject: string;
  message: string;
}

const fieldLabel =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/50";
const fieldControl =
  "mt-2 w-full border-0 bg-transparent p-0 text-[15px] text-foreground outline-none placeholder:text-foreground/35";

export function ConcernSubmissionForm({
  turnstileSiteKey,
}: ConcernSubmissionFormProps) {
  const turnstileEnabled = turnstileSiteKey !== null;
  const [idempotencyKey, setIdempotencyKey] = React.useState(() =>
    createClientIdempotencyKey(),
  );
  const [values, setValues] = React.useState<ConcernSubmissionValues>({
    category: "other",
    subject: "",
    message: "",
  });
  const [turnstileToken, setTurnstileToken] = React.useState("");
  const [turnstileResetSignal, setTurnstileResetSignal] = React.useState(0);

  const handleTurnstileTokenChange = React.useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const submitMutation = useMutation({
    mutationFn: submitConcern,
    onError(error) {
      toast.error(error.message);
      if (turnstileEnabled) setTurnstileResetSignal((value) => value + 1);
    },
    onSuccess(result) {
      toast.success(result.message);
      setValues({ category: "other", subject: "", message: "" });
      setIdempotencyKey(createClientIdempotencyKey());
      if (turnstileEnabled) setTurnstileResetSignal((value) => value + 1);
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsedInput = createConcernInputSchema.safeParse({
      category: values.category,
      subject: values.subject,
      message: values.message,
      attachmentStorageObjectId: null,
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ?? "Check the concern details.",
      );
      return;
    }

    if (turnstileEnabled && turnstileToken.length === 0) {
      toast.error("Complete the security check before submitting.");
      return;
    }

    submitMutation.mutate({
      idempotencyKey,
      input: parsedInput.data,
      token: turnstileToken,
    });
  }

  function updateCategory(value: string): void {
    const parsedCategory = concernCategorySchema.safeParse(value);
    if (!parsedCategory.success) return;
    setValues((current) => ({ ...current, category: parsedCategory.data }));
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="border border-hairline bg-paper-2">
        <div className="border-b border-hairline p-5">
          <label htmlFor="concern-category" className={fieldLabel}>
            Category
          </label>
          <Select onValueChange={updateCategory} value={values.category}>
            <SelectTrigger
              id="concern-category"
              className="mt-1.5 h-auto w-full border-0 bg-transparent p-0 text-[15px] shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent [&>svg]:opacity-50"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONCERN_CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border-b border-hairline p-5">
          <label htmlFor="concern-subject" className={fieldLabel}>
            Subject
          </label>
          <input
            id="concern-subject"
            className={fieldControl}
            maxLength={255}
            placeholder="Brief summary"
            value={values.subject}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                subject: event.currentTarget.value,
              }))
            }
          />
        </div>

        <div className="p-5">
          <label htmlFor="concern-message" className={fieldLabel}>
            Details
          </label>
          <textarea
            id="concern-message"
            className={`${fieldControl} min-h-36 resize-none leading-relaxed`}
            maxLength={10_000}
            placeholder="Describe the concern clearly. Do not include your name unless you want to."
            value={values.message}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                message: event.currentTarget.value,
              }))
            }
          />
        </div>
      </div>

      {turnstileEnabled ? (
        <TurnstileField
          action="concern"
          className="mt-5"
          onTokenChange={handleTurnstileTokenChange}
          resetSignal={turnstileResetSignal}
          siteKey={turnstileSiteKey}
        />
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-foreground/50">
          Your identity is never requested.
        </p>
        <Button
          variant="gold"
          className="rounded-full"
          disabled={submitMutation.isPending}
          type="submit"
        >
          <Send className="size-4" />
          {submitMutation.isPending ? "Submitting…" : "Submit concern"}
        </Button>
      </div>
    </form>
  );
}

async function submitConcern({
  idempotencyKey,
  input,
  token,
}: {
  idempotencyKey: string;
  input: CreateConcernInput;
  token: string;
}): Promise<ActionResult> {
  const response = await fetch("/api/concerns", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      ...(token ? { "x-captcha-response": token } : {}),
    },
    method: "POST",
  });
  const body: unknown = await response.json();
  const result = actionResultSchema.parse(body);

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Concern submission failed.");
  }

  return result;
}

function createClientIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
