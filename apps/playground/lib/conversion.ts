export type ConversionEvent =
  | "landing_view"
  | "url_submitted"
  | "compile_completed"
  | "compile_failed"
  | "render_completed"
  | "render_failed"
  | "agent_cta_clicked"
  | "pricing_cta_clicked"
  | "content_program_cta_clicked"
  | "creative_mode_selected"
  | "template_preview_selected"
  | "audience_selected"
  | "login_submitted"
  | "login_link_sent"
  | "login_failed";

type Property = string | number | boolean;

function sessionId(): string {
  const key = "brandrail_conversion_session";
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
  } catch {
    // Tracking remains best-effort when storage is blocked.
  }

  const id = typeof window.crypto?.randomUUID === "function"
    ? window.crypto.randomUUID()
    : Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  try {
    sessionStorage.setItem(key, id);
  } catch {
    // A short-lived id still lets the server accept the event.
  }
  return id;
}

/** Privacy-light funnel events: the browser sends a session-scoped random id,
 * event name and non-sensitive product context. URLs, emails and copy are never
 * included. The server can forward these to PostHog when configured. */
export function trackConversion(event: ConversionEvent, properties: Record<string, Property> = {}): void {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({ event, sessionId: sessionId(), properties, path: window.location.pathname });
    void fetch("/api/conversion", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never interrupt the product journey.
  }
}
