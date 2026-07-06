"use client";

import { RecoveryState } from "@/components/errors/recovery-state";

export default function AuthError({ reset }: { reset: () => void }) {
  return (
    <RecoveryState
      description="This account screen could not load. Try again, or return to sign in."
      eyebrow="Account interrupted"
      homeHref="/sign-in"
      homeLabel="Back to sign in"
      onReset={reset}
      title="Account flow paused."
      variant="compact"
    />
  );
}
