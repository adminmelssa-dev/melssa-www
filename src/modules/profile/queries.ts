import "server-only";

import { headers } from "next/headers";
import { getAuthenticatorName } from "@better-auth/passkey";
import type {
  PasskeyListItem,
  SessionListItem,
} from "@/modules/profile/contracts";
import { auth } from "@/server/auth/config";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export async function getUserPasskeys(): Promise<PasskeyListItem[]> {
  const passkeys = await auth.api.listPasskeys({ headers: await headers() });

  return passkeys.map((passkey) => ({
    id: passkey.id,
    label:
      passkey.name?.trim() ||
      getAuthenticatorName(passkey.aaguid) ||
      "Passkey",
    deviceType: passkey.deviceType ?? null,
    backedUp: passkey.backedUp,
    createdAtLabel: dateFormatter.format(passkey.createdAt),
  }));
}

export async function getUserSessions(
  currentSessionToken: string,
): Promise<SessionListItem[]> {
  const activeSessions = await auth.api.listSessions({ headers: await headers() });

  return [...activeSessions]
    .sort(
      (firstSession, secondSession) =>
        secondSession.updatedAt.getTime() - firstSession.updatedAt.getTime(),
    )
    .map((session) => ({
      id: session.id,
      deviceLabel: getDeviceLabel(session.userAgent ?? null),
      ipAddress: session.ipAddress ?? null,
      isCurrent: session.token === currentSessionToken,
      createdAtLabel: dateFormatter.format(session.createdAt),
      lastActiveAtLabel: dateTimeFormatter.format(session.updatedAt),
      expiresAtLabel: dateFormatter.format(session.expiresAt),
    }));
}

function getDeviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";

  const browser = getBrowserLabel(userAgent);
  const platform = getPlatformLabel(userAgent);

  if (browser === "Unknown browser" && platform === "Unknown device") {
    return "Unknown device";
  }

  return `${browser} on ${platform}`;
}

function getBrowserLabel(userAgent: string): string {
  if (userAgent.includes("Edg/")) return "Microsoft Edge";
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("Chrome/") || userAgent.includes("CriOS/")) {
    return "Chrome";
  }
  if (userAgent.includes("Safari/")) return "Safari";

  return "Unknown browser";
}

function getPlatformLabel(userAgent: string): string {
  if (userAgent.includes("iPhone")) return "iPhone";
  if (userAgent.includes("iPad")) return "iPad";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("Mac OS X") || userAgent.includes("Macintosh")) {
    return "macOS";
  }
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Linux")) return "Linux";

  return "Unknown device";
}
