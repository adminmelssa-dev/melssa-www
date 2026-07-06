import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthMessageVariant = "error" | "success" | "info";

interface AuthMessageProps {
  children: ReactNode;
  variant: AuthMessageVariant;
}

const messageStyles: Record<
  AuthMessageVariant,
  {
    className: string;
    icon: LucideIcon;
  }
> = {
  error: {
    className: "border-destructive/25 bg-destructive/10 text-destructive",
    icon: AlertCircle,
  },
  success: {
    className: "border-primary/25 bg-primary/10 text-primary",
    icon: CheckCircle2,
  },
  info: {
    className: "border-border bg-muted text-muted-foreground",
    icon: Info,
  },
};

export function AuthMessage({ children, variant }: AuthMessageProps) {
  const Icon = messageStyles[variant].icon;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-md border p-3 text-sm leading-5",
        messageStyles[variant].className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
