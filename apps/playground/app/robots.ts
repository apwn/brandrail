import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/agents", "/docs"],
      disallow: [
        "/api/",
        "/login",
        "/dashboard",
        "/review",
        "/settings",
        "/activity",
        "/runs",
        "/calendar",
        "/campaigns",
        "/program",
        "/analytics",
        "/brands",
        "/share/",
      ],
    },
    sitemap: "https://playground.brandrail.dev/sitemap.xml",
  };
}
