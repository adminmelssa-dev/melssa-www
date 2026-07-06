"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/modules/auth/client";

interface SignOutButtonProps {
  redirectTo?: string;
}

export function SignOutButton({
  redirectTo = "/sign-in?force=true",
}: SignOutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignOut() {
    setIsSubmitting(true);

    const result = await authClient.signOut();

    if (result.error) {
      toast.error(result.error.message ?? "Sign out failed.");
      setIsSubmitting(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={isSubmitting}
    >
      <LogOut className="size-4" />
      {isSubmitting ? "Signing out..." : "Sign out"}
    </Button>
  );
}
