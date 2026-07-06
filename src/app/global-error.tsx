"use client";

import { RecoveryState } from "@/components/errors/recovery-state";
import "./globals.css";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <RecoveryState
          description="The portal shell could not start correctly. Try again, or return to the homepage."
          eyebrow="Portal unavailable"
          onReset={reset}
          title="We could not open the portal."
          variant="standalone"
        />
      </body>
    </html>
  );
}
