export function normalizeAuthCallbackURL(
  value: string | string[] | null | undefined,
): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/dashboard";
  }

  return candidate;
}

export function getAuthPageHref(
  pathname: "/sign-in" | "/sign-up",
  callbackURL: string,
): string {
  const params = new URLSearchParams();
  params.set("callbackURL", normalizeAuthCallbackURL(callbackURL));
  return `${pathname}?${params.toString()}`;
}
