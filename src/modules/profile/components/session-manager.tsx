"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Clock3,
  Loader2,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ProfileSessionMutation,
  type SessionListItem,
} from "@/modules/profile/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";

interface SessionManagerProps {
  sessions: SessionListItem[];
}

export function SessionManager({ sessions }: SessionManagerProps) {
  const router = useRouter();
  const otherSessionCount = sessions.filter((session) => !session.isCurrent)
    .length;

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
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <CardTitle>Sessions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review active sign-ins and revoke sessions you no longer use.
              </p>
            </div>
          </div>
          {otherSessionCount > 0 ? (
            <Button
              disabled={sessionMutation.isPending}
              onClick={() =>
                sessionMutation.mutate({ intent: "revokeOther" })
              }
              size="sm"
              type="button"
              variant="outline"
            >
              {revokingOtherSessions ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              Revoke others
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ul className="divide-y">
          {sessions.map((session) => (
            <li
              className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center"
              key={session.id}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <MonitorSmartphone className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{session.deviceLabel}</p>
                  {session.isCurrent ? (
                    <Badge variant="secondary">Current</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {session.ipAddress ?? "Unknown IP"} · Last active{" "}
                  {session.lastActiveAtLabel}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
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
                >
                  {pendingSessionId === session.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        Password changes automatically revoke other sessions.
      </CardFooter>
    </Card>
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
