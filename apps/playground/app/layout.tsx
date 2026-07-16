import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://playground.brandrail.dev"),
  title: "Brandrail — one brief to a month of on-brand content",
  description:
    "Turn one brief into a rolling month of on-brand content. Plan 30 days, produce the next week and keep human approval before publishing.",
  openGraph: {
    title: "Turn one brief into a week of on-brand content.",
    description: "Your agent plans 30 days. Brandrail produces the next week, enforces every brand rule and waits for human approval before publishing.",
    type: "website",
    url: "/",
    images: [{ url: "/og-agent.png", width: 1731, height: 909, alt: "Brandrail turns one brief into an approved, on-brand channel set" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Turn one brief into a week of on-brand content.",
    description: "Thirty days planned, the next week produced, BrandSpec-enforced and human-approved before publishing.",
    images: ["/og-agent.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Brandrail",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Agent-first branded content operations: plan, render, review and publish channel-ready campaigns through an enforceable brand system.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: "https://playground.brandrail.dev/",
  };
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-ink text-bone font-body antialiased min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }} />
        {children}
      </body>
    </html>
  );
}
