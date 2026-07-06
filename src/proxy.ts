import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const secureCookie = request.cookies.get("__Secure-better-auth.session_token");
  const plainCookie = request.cookies.get("better-auth.session_token");
  const sessionCookie = secureCookie ?? plainCookie;
  const { pathname } = request.nextUrl;

  const isAuthOnlyPage =
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";

  if (isAuthOnlyPage && sessionCookie && request.nextUrl.searchParams.has("force")) {
    const response = NextResponse.redirect(new URL(pathname, request.url));
    if (secureCookie) response.cookies.delete("__Secure-better-auth.session_token");
    if (plainCookie) response.cookies.delete("better-auth.session_token");
    return response;
  }

  if (isAuthOnlyPage && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/dashboard") && !sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
};
