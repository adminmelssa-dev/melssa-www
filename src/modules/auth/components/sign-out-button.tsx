"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/modules/auth/client";

export function SignOutButton() {
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

    router.push("/sign-in?force=true");
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
