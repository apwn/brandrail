import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://playground.brandrail.dev"),
  title: "Brandrail — agent-native content operations",
  description:
    "Connect your agent to an enforceable brand system. Plan, render, review, publish and learn without letting AI break the brand.",
  openGraph: {
    title: "Your agent can write. Brandrail makes it publish on-brand.",
    description: "Agent-native content operations with BrandSpec enforcement, human approval, publishing and performance feedback.",
    type: "website",
    url: "/",
    images: [{ url: "/og-agent.png", width: 1731, height: 909, alt: "Brandrail agent-native content operations workflow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your agent can write. Brandrail makes it publish on-brand.",
    description: "BrandSpec-enforced content operations with human approval built in.",
    images: ["/og-agent.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-ink text-bone font-body antialiased min-h-screen">{children}</body>
    </html>
  );
}
