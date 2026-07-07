"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TurnstileField } from "@/components/security/turnstile-field";
import {
  createFundraisingInquiryInputSchema,
  type CreateFundraisingInquiryInput,
  type FundraisingCampaignRow,
} from "@/modules/fundraising/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";

interface FundraisingInquiryFormProps {
  campaigns: FundraisingCampaignRow[];
  selectedCampaignId?: number;
  turnstileSiteKey: string | null;
}

interface InquiryFormValues {
  organizationName: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  message: string;
}

const fieldLabel =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/50";
const fieldControl =
  "mt-2 w-full border-0 bg-transparent p-0 text-[15px] text-foreground outline-none placeholder:text-foreground/35";

export function FundraisingInquiryForm({
  campaigns,
  selectedCampaignId,
  turnstileSiteKey,
}: FundraisingInquiryFormProps) {
  const turnstileEnabled = turnstileSiteKey !== null;
  const [idempotencyKey, setIdempotencyKey] = React.useState(() =>
    createClientIdempotencyKey(),
  );
  const [campaignId, setCampaignId] = React.useState<number | null>(
    selectedCampaignId ?? campaigns[0]?.id ?? null,
  );
  const [values, setValues] = React.useState<InquiryFormValues>({
    organizationName: "",
    contactName: "",
    contactEmail: "",
    phone: "",
    message: "",
  });
  const [turnstileToken, setTurnstileToken] = React.useState("");
  const [turnstileResetSignal, setTurnstileResetSignal] = React.useState(0);

  const submitMutation = useMutation({
    mutationFn: submitInquiry,
    onError(error) {
      toast.error(error.message);
      if (turnstileEnabled) setTurnstileResetSignal((value) => value + 1);
    },
    onSuccess(result) {
      toast.success(result.message);
      setValues({
        organizationName: "",
        contactName: "",
        contactEmail: "",
        phone: "",
        message: "",
      });
      setIdempotencyKey(createClientIdempotencyKey());
      if (turnstileEnabled) setTurnstileResetSignal((value) => value + 1);
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsedInput = createFundraisingInquiryInputSchema.safeParse({
      campaignId,
      organizationName: values.organizationName,
      contactName: values.contactName,
      contactEmail: values.contactEmail,
      phone: values.phone,
      message: values.message,
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ?? "Check the inquiry details.",
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

  function updateValue(field: keyof InquiryFormValues, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="border border-hairline bg-paper-2">
        {campaigns.length > 0 ? (
          <div className="border-b border-hairline p-5">
            <label htmlFor="fundraising-campaign" className={fieldLabel}>
              Campaign
            </label>
            <select
              id="fundraising-campaign"
              className={fieldControl}
              onChange={(event) => setCampaignId(Number(event.currentTarget.value))}
              value={campaignId ?? ""}
            >
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <TextField
          id="fundraising-organization"
          label="Organization"
          onChange={(value) => updateValue("organizationName", value)}
          placeholder="Company, alumni group, or individual name"
          value={values.organizationName}
        />
        <TextField
          id="fundraising-contact-name"
          label="Contact name"
          onChange={(value) => updateValue("contactName", value)}
          placeholder="Who should MELSSA contact?"
          required
          value={values.contactName}
        />
        <TextField
          id="fundraising-contact-email"
          label="Email"
          onChange={(value) => updateValue("contactEmail", value)}
          placeholder="name@example.com"
          required
          type="email"
          value={values.contactEmail}
        />
        <TextField
          id="fundraising-phone"
          label="Phone"
          onChange={(value) => updateValue("phone", value)}
          placeholder="Optional phone or WhatsApp number"
          value={values.phone}
        />
        <div className="p-5">
          <label htmlFor="fundraising-message" className={fieldLabel}>
            Message
          </label>
          <textarea
            className={`${fieldControl} min-h-32 resize-none leading-relaxed`}
            id="fundraising-message"
            maxLength={5_000}
            onChange={(event) => updateValue("message", event.currentTarget.value)}
            placeholder="Share how you would like to support MELSSA."
            required
            value={values.message}
          />
        </div>
      </div>

      {turnstileEnabled ? (
        <TurnstileField
          action="fundraising"
          className="mt-5"
          onTokenChange={setTurnstileToken}
          resetSignal={turnstileResetSignal}
          siteKey={turnstileSiteKey}
        />
      ) : null}

      <div className="mt-6 flex justify-end">
        <Button
          className="rounded-full"
          disabled={submitMutation.isPending}
          type="submit"
          variant="gold"
        >
          <Send className="size-4" />
          {submitMutation.isPending ? "Submitting…" : "Send inquiry"}
        </Button>
      </div>
    </form>
  );
}

function TextField({
  id,
  label,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: "email" | "text";
  value: string;
}) {
  return (
    <div className="border-b border-hairline p-5">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <input
        className={fieldControl}
        id={id}
        maxLength={255}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </div>
  );
}

async function submitInquiry({
  idempotencyKey,
  input,
  token,
}: {
  idempotencyKey: string;
  input: CreateFundraisingInquiryInput;
  token: string;
}): Promise<ActionResult> {
  const response = await fetch("/api/fundraising/inquiries", {
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
    throw new Error(result.message || "Inquiry submission failed.");
  }

  return result;
}

function createClientIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
