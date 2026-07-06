"use client";

import { RecoveryState } from "@/components/errors/recovery-state";

export default function RootError({ reset }: { reset: () => void }) {
  return (
    <RecoveryState
      description="The portal could not finish loading this view. Try again, or return home and continue from there."
      eyebrow="Portal interrupted"
      onReset={reset}
      title="Something did not load cleanly."
      variant="standalone"
    />
  );
}
