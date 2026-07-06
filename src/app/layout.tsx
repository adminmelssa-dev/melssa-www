import type { Metadata, Viewport } from "next";
import { Baskervville, Inter } from "next/font/google";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { env } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const baskervville = Baskervville({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  applicationName: "MELSSA Student Portal",
  title: {
    default: "MELSSA Student Portal",
    template: "%s | MELSSA",
  },
  description:
    "Academic resources, association updates, events, and anonymous student support for MELSSA students at Accra Technical University.",
  keywords: [
    "MELSSA",
    "Medical Laboratory Science",
    "Accra Technical University",
    "student portal",
    "academic resources",
  ],
  authors: [{ name: "MELSSA" }],
  creator: "MELSSA",
  publisher: "MELSSA",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "MELSSA Student Portal",
    title: "MELSSA Student Portal",
    description:
      "Academic resources, association updates, events, and anonymous student support for MELSSA students at Accra Technical University.",
    images: [
      {
        url: "/atu-students.jpg",
        width: 1200,
        height: 630,
        alt: "MELSSA students at Accra Technical University",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "MELSSA Student Portal",
    description:
      "Academic resources, association updates, events, and anonymous student support for MELSSA students at Accra Technical University.",
    images: ["/atu-students.jpg"],
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0e2a54",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${baskervville.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider>
              {children}
              <ThemedToaster />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
