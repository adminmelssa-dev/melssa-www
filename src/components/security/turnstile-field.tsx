"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { cn } from "@/lib/utils";

type TurnstileTheme = "light" | "dark" | "auto";

interface TurnstileRenderOptions {
  action?: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  sitekey: string;
  theme?: TurnstileTheme;
}

interface TurnstileController {
  remove(widgetId: string): void;
  render(container: HTMLElement, options: TurnstileRenderOptions): string;
  reset(widgetId?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileController;
  }
}

interface TurnstileFieldProps {
  action: string;
  className?: string;
  onTokenChange: (token: string) => void;
  resetSignal?: number;
  siteKey: string;
}

export function TurnstileField({
  action,
  className,
  onTokenChange,
  resetSignal = 0,
  siteKey,
}: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const lastResetSignalRef = useRef(resetSignal);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const turnstile = window.turnstile;
    const container = containerRef.current;

    if (!scriptReady || !turnstile || !container || widgetIdRef.current) {
      return;
    }

    const widgetId = turnstile.render(container, {
      action,
      callback: onTokenChange,
      "error-callback": () => onTokenChange(""),
      "expired-callback": () => onTokenChange(""),
      sitekey: siteKey,
      theme: "auto",
    });

    widgetIdRef.current = widgetId;

    return () => {
      turnstile.remove(widgetId);
      widgetIdRef.current = null;
      onTokenChange("");
    };
  }, [action, onTokenChange, scriptReady, siteKey]);

  useEffect(() => {
    if (lastResetSignalRef.current === resetSignal) return;
    lastResetSignalRef.current = resetSignal;

    const widgetId = widgetIdRef.current;
    const turnstile = window.turnstile;

    if (!turnstile || !widgetId) return;

    turnstile.reset(widgetId);
    onTokenChange("");
  }, [onTokenChange, resetSignal]);

  return (
    <div className={cn("min-h-[65px]", className)}>
      <Script
        id="cloudflare-turnstile-api"
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={containerRef} />
    </div>
  );
}
