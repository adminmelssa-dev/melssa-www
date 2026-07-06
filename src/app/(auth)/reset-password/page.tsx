import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
