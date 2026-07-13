import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://playground.brandrail.dev"),
  title: "Brandrail — every post, on brand, ready to publish",
  description:
    "Brand-locked content from brief to publish. Paste any website and see five ready-to-review posts rendered from an enforceable BrandSpec in 60 seconds.",
  openGraph: {
    title: "Brandrail — every post, on brand, ready to publish",
    description: "Turn any website into a portable BrandSpec and five ready-to-review social posts. Try your real brand free.",
    type: "website",
    url: "/",
    images: [{ url: "/proof/og-image.png", width: 1200, height: 630, alt: "Brandrail brand-locked social content" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brandrail — every post, on brand, ready to publish",
    description: "Paste any website. See five ready-to-review posts in 60 seconds.",
    images: ["/proof/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-ink text-bone font-body antialiased min-h-screen">{children}</body>
    </html>
  );
}
