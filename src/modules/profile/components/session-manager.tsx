"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Clock3, Loader2, LogOut, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProfileSection } from "@/modules/profile/components/profile-ui";
import {
  type ProfileSessionMutation,
  type SessionListItem,
} from "@/modules/profile/contracts";
import { actionResultSchema, type ActionResult } from "@/lib/action-result";

interface SessionManagerProps {
  sessions: SessionListItem[];
}

export function SessionManager({ sessions }: SessionManagerProps) {
  const router = useRouter();
  const otherSessionCount = sessions.filter(
    (session) => !session.isCurrent,
  ).length;

  const sessionMutation = useMutation({
    mutationFn: updateSessions,
    onError(error) {
      toast.error(error.message);
    },
    onSuccess(result) {
      toast.success(result.message);
      router.refresh();
    },
  });

  const pendingSessionId = getPendingSessionId(sessionMutation.variables);
  const revokingOtherSessions =
    sessionMutation.isPending &&
    sessionMutation.variables?.intent === "revokeOther";

  return (
    <ProfileSection
      title="Sessions"
      description="Review active sign-ins and revoke sessions you no longer use."
      action={
        otherSessionCount > 0 ? (
          <Button
            disabled={sessionMutation.isPending}
            onClick={() => sessionMutation.mutate({ intent: "revokeOther" })}
            size="sm"
            type="button"
            variant="outline"
            className="rounded-full"
          >
            {revokingOtherSessions ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Revoke others
          </Button>
        ) : null
      }
    >
      <div className="border-t border-hairline">
        {sessions.map((session) => (
          <div
            className="flex flex-col gap-4 border-b border-hairline py-4 sm:flex-row sm:items-center"
            key={session.id}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-gold-soft text-gold-ink">
              <MonitorSmartphone className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium text-foreground">
                  {session.deviceLabel}
                </p>
                {session.isCurrent ? (
                  <span className="rounded border border-hairline px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-gold-ink">
                    Current
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {session.ipAddress ?? "Unknown IP"} · Last active{" "}
                {session.lastActiveAtLabel}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground/45">
                <Clock3 className="size-3.5" />
                Created {session.createdAtLabel} · Expires{" "}
                {session.expiresAtLabel}
              </p>
            </div>
            {session.isCurrent ? null : (
              <Button
                disabled={sessionMutation.isPending}
                onClick={() =>
                  sessionMutation.mutate({
                    intent: "revoke",
                    sessionId: session.id,
                  })
                }
                size="sm"
                type="button"
                variant="destructive"
                className="rounded-full"
              >
                {pendingSessionId === session.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                Revoke
              </Button>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Password changes automatically revoke other sessions.
      </p>
    </ProfileSection>
  );
}

async function updateSessions(
  input: ProfileSessionMutation,
): Promise<ActionResult> {
  const response = await fetch("/api/profile/sessions", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const body: unknown = await response.json();
  const result = actionResultSchema.parse(body);

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Session update failed.");
  }

  return result;
}

function getPendingSessionId(
  input: ProfileSessionMutation | undefined,
): string | null {
  if (input?.intent === "revoke") return input.sessionId;
  return null;
}
