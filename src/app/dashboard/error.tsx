"use client";

import { RecoveryState } from "@/components/errors/recovery-state";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <RecoveryState
      description="The dashboard could not complete this request. Try again, or return to the overview."
      eyebrow="Dashboard interrupted"
      homeHref="/dashboard"
      homeLabel="Back to overview"
      onReset={reset}
      title="This workspace needs a reload."
      variant="section"
    />
  );
}
