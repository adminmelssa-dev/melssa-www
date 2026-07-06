import type { Metadata } from "next";
import { RecoveryState } from "@/components/errors/recovery-state";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <RecoveryState
      description="The page may have moved, or the address may not match a published MELSSA portal route."
      eyebrow="404"
      homeLabel="Return home"
      title="This page is not in the archive."
      variant="standalone"
    />
  );
}
