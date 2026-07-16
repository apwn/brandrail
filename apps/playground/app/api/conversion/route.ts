import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/request";

const EVENTS = new Set([
  "landing_view", "url_submitted", "compile_completed", "compile_failed",
  "render_completed", "render_failed", "agent_cta_clicked", "pricing_cta_clicked",
  "content_program_cta_clicked", "content_program_exported", "template_family_cta_clicked",
  "creative_mode_selected", "template_preview_selected", "audience_selected",
  "login_submitted", "login_link_sent", "login_failed",
]);

function safeProperties(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 12)
      .filter(([key, item]) => key.length <= 40 && (typeof item === "string" || typeof item === "number" || typeof item === "boolean"))
      .map(([key, item]) => [key, typeof item === "string" ? item.slice(0, 120) : item]),
  ) as Record<string, string | number | boolean>;
}

function isSameOrigin(origin: string, requestUrl: string): boolean {
  try {
    return new URL(origin).host === new URL(requestUrl).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  // Sec-Fetch-Site is browser-controlled and survives reverse-proxy host
  // normalization. Fall back to Origin comparison when the signal is absent.
  if (fetchSite === "cross-site" || (fetchSite !== "same-origin" && origin && !isSameOrigin(origin, request.url))) {
    return NextResponse.json({ error: "cross-site events are not accepted" }, { status: 403 });
  }

  const parsed = await readJsonBody<{ event?: unknown; sessionId?: unknown; path?: unknown; properties?: unknown }>(request, 4_096);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  if (!body || typeof body.event !== "string" || !EVENTS.has(body.event)) return NextResponse.json({ error: "unknown conversion event" }, { status: 400 });
  if (typeof body.sessionId !== "string" || !/^[a-f0-9-]{20,64}$/i.test(body.sessionId)) return NextResponse.json({ error: "invalid session" }, { status: 400 });
  const properties = {
    ...safeProperties(body.properties),
    path: typeof body.path === "string" ? body.path.slice(0, 100) : "/",
    source: "brandrail-web",
  };

  const apiKey = process.env.POSTHOG_API_KEY?.trim();
  if (apiKey) {
    const host = (process.env.POSTHOG_HOST?.trim() || "https://us.i.posthog.com").replace(/\/$/, "");
    try {
      const response = await fetch(`${host}/capture/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, event: body.event, properties: { distinct_id: body.sessionId, ...properties } }),
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) console.warn(`[conversion] PostHog returned ${response.status}`);
    } catch {
      console.warn("[conversion] PostHog delivery failed");
    }
  } else if (process.env.NODE_ENV !== "test") {
    console.info(JSON.stringify({ type: "conversion", event: body.event, sessionId: body.sessionId, properties }));
  }

  return new NextResponse(null, { status: 202 });
}
