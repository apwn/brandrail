import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Brandrail Playground — paste your website, see your next 5 posts",
  description:
    "AI can think. It still can't design. Brandrail compiles your website into a BrandSpec and renders designer-quality, brand-locked posts from a one-line brief.",
  openGraph: {
    title: "Brandrail — on-brand, on autopilot",
    description: "Paste your website → see your next 5 posts. Deterministic, brand-locked rendering for AI agents.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-ink text-bone font-body antialiased min-h-screen">{children}</body>
    </html>
  );
}
