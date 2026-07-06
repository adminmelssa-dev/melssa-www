"use client";

import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

interface PasswordCheck {
  label: string;
  passed: boolean;
}

function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: "8+ characters", passed: password.length >= 8 },
    { label: "Uppercase", passed: /[A-Z]/.test(password) },
    { label: "Lowercase", passed: /[a-z]/.test(password) },
    { label: "Number", passed: /\d/.test(password) },
    { label: "Symbol", passed: /[^A-Za-z0-9]/.test(password) },
  ];
}

function getStrengthLabel(score: number): string {
  if (score >= 5) return "Strong";
  if (score >= 3) return "Good";
  if (score >= 1) return "Weak";
  return "Empty";
}

function getStrengthTone(score: number): string {
  if (score >= 5) return "bg-primary";
  if (score >= 3) return "bg-gold";
  if (score >= 1) return "bg-destructive";
  return "bg-muted";
}

export function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  const checks = getPasswordChecks(password);
  const score = checks.filter((check) => check.passed).length;
  const width = password.length === 0 ? 0 : (score / checks.length) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">
          Password strength
        </span>
        <span className="text-muted-foreground">{getStrengthLabel(score)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", getStrengthTone(score))}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
        {checks.map((check) => (
          <span
            key={check.label}
            className={cn(check.passed && "font-medium text-primary")}
          >
            {check.label}
          </span>
        ))}
      </div>
    </div>
  );
}
