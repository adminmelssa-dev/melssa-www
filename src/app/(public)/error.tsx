"use client";

import { RecoveryState } from "@/components/errors/recovery-state";

export default function PublicError({ reset }: { reset: () => void }) {
  return (
    <div className="px-7 py-16">
      <RecoveryState
        description="We could not load this public portal page. Try again, or return to the homepage."
        eyebrow="Page interrupted"
        onReset={reset}
        title="This page needs another pass."
      />
    </div>
  );
}
