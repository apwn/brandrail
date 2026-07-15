/**
 * Return the one canonical browser origin used in links that leave the app
 * (email, OAuth and billing redirects). Never trust an inbound Host header in
 * production: a poisoned host can turn a valid magic link into token leakage.
 */
export function publicOrigin(request: Request): string {
  const configured = process.env.PUBLIC_URL?.trim();
  if (process.env.NODE_ENV === "production" && !configured) {
    throw new Error("PUBLIC_URL must be set to the canonical HTTPS app origin in production");
  }

  const candidate = configured ?? new URL(request.url).origin;
  const url = new URL(candidate);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("PUBLIC_URL must be an http(s) URL without embedded credentials");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("PUBLIC_URL must use HTTPS in production");
  }
  return url.origin;
}
