import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const uploadPublicHostnames = csv(process.env.UPLOAD_PUBLIC_HOSTNAMES);

function originFromUrl(value: string | undefined): string {
  if (!value) return "";

  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function hostnameFromUrl(value: string | undefined): string {
  if (!value) return "";

  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

function csv(value: string | undefined): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function cspSources(values: string[]): string {
  return values.filter((value) => value.length > 0).join(" ");
}

const appOrigin = originFromUrl(process.env.NEXT_PUBLIC_APP_URL);
const betterAuthOrigin = originFromUrl(process.env.BETTER_AUTH_URL);
const turnstileOrigin = "https://challenges.cloudflare.com";

const uploadImageHosts = [
  "https://*.ufs.sh",
  "https://ufs.sh",
  "https://utfs.io",
  "https://*.utfs.io",
  ...uploadPublicHostnames.map((hostname) => `https://${hostname}`),
];

const imageSources = cspSources([
  "'self'",
  "data:",
  "blob:",
  ...uploadImageHosts,
  isDevelopment ? "http://localhost:*" : "",
  isDevelopment ? "http://127.0.0.1:*" : "",
]);

const connectSources = cspSources([
  "'self'",
  appOrigin,
  betterAuthOrigin,
  "https://api.uploadthing.com",
  "https://ingest.uploadthing.com",
  "https://*.ufs.sh",
  isDevelopment ? "http://localhost:*" : "",
  isDevelopment ? "http://127.0.0.1:*" : "",
  isDevelopment ? "ws://localhost:*" : "",
  isDevelopment ? "ws://127.0.0.1:*" : "",
]);

const mediaSources = cspSources(["'self'", "data:", "blob:", ...uploadImageHosts]);
const scriptSources = cspSources([
  "'self'",
  "'unsafe-inline'",
  isDevelopment ? "'unsafe-eval'" : "",
  turnstileOrigin,
]);
const frameSources = cspSources(["'self'", turnstileOrigin]);

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src ${scriptSources}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imageSources}`,
  "font-src 'self' data:",
  `connect-src ${connectSources}`,
  `media-src ${mediaSources}`,
  `frame-src ${frameSources}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
];

const uploadHostnames = new Set([
  "*.ufs.sh",
  "ufs.sh",
  "utfs.io",
  "*.utfs.io",
  ...uploadPublicHostnames,
]);

type ImageRemotePatterns = NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>;

const imageRemotePatterns: ImageRemotePatterns = [...uploadHostnames].map(
  (hostname) => ({
    protocol: "https",
    hostname,
  }),
);

const appHostname = hostnameFromUrl(process.env.NEXT_PUBLIC_APP_URL);
if (appHostname) {
  imageRemotePatterns.push({
    protocol: "https",
    hostname: appHostname,
  });
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: imageRemotePatterns,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
