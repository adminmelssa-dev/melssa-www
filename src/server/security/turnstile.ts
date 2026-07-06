import "server-only";
import { env } from "@/lib/env";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const turnstileConfigured = env.TURNSTILE_SECRET_KEY !== undefined;

interface SiteverifyResponse {
  success: boolean;
  hostname?: string;
}

export async function verifyTurnstileToken(
  token: string | null,
  remoteIp: string | null,
): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteIp) form.set("remoteip", remoteIp);

  let data: SiteverifyResponse;
  try {
    const response = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    data = (await response.json()) as SiteverifyResponse;
  } catch {
    return false;
  }

  if (!data.success) return false;

  const allowedHostnames = env.TURNSTILE_ALLOWED_HOSTNAMES;
  if (
    allowedHostnames.length > 0 &&
    data.hostname !== undefined &&
    !allowedHostnames.includes(data.hostname)
  ) {
    return false;
  }

  return true;
}
