import { z } from "zod";

export const actionResultSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
});

export interface ActionResult {
  ok: boolean;
  message: string;
}

export class ExpectedError extends Error {}

export function successResult(message: string): ActionResult {
  return { ok: true, message };
}

export function errorResult(error: unknown, fallback: string): ActionResult {
  if (error instanceof Error && error.message) {
    return { ok: false, message: error.message };
  }

  return { ok: false, message: fallback };
}
