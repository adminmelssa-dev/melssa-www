"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { actionResultSchema } from "@/lib/action-result";

interface AcceptInviteFormProps {
  roleLabel: string;
  token: string;
}

export function AcceptInviteForm({
  roleLabel,
  token,
}: AcceptInviteFormProps) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: acceptInvitation,
    onError(error) {
      toast.error(error.message);
    },
    onSuccess(result) {
      toast.success(result.message);
      router.push("/dashboard");
      router.refresh();
    },
  });

  return (
    <Button
      type="button"
      className="w-full"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(token)}
    >
      <ShieldCheck className="size-4" />
      {mutation.isPending ? "Accepting..." : `Accept ${roleLabel} invite`}
    </Button>
  );
}

async function acceptInvitation(token: string) {
  const response = await fetch("/api/invitations/accept", {
    body: JSON.stringify({ token }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const body: unknown = await response.json();
  const result = actionResultSchema.parse(body);

  if (!response.ok || !result.ok) {
    throw new Error(result.message);
  }

  return result;
}
