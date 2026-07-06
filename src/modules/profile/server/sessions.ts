import "server-only";

import { headers } from "next/headers";
import { ExpectedError } from "@/lib/action-result";
import { auth } from "@/server/auth/config";

export async function revokeUserSession(sessionId: string): Promise<void> {
  const requestHeaders = await headers();
  const currentSession = await auth.api.getSession({ headers: requestHeaders });

  if (!currentSession) {
    throw new ExpectedError("You must be signed in to manage sessions.");
  }

  const activeSessions = await auth.api.listSessions({
    headers: requestHeaders,
  });
  const targetSession = activeSessions.find((session) => session.id === sessionId);

  if (!targetSession) {
    throw new ExpectedError("Session not found.");
  }

  if (targetSession.token === currentSession.session.token) {
    throw new ExpectedError("Use sign out to end your current session.");
  }

  const result = await auth.api.revokeSession({
    body: { token: targetSession.token },
    headers: requestHeaders,
  });

  if (!result.status) {
    throw new Error("Session could not be revoked.");
  }
}

export async function revokeOtherUserSessions(): Promise<void> {
  const result = await auth.api.revokeOtherSessions({
    headers: await headers(),
  });

  if (!result.status) {
    throw new Error("Other sessions could not be revoked.");
  }
}
