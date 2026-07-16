const DEFAULT_JSON_LIMIT = 1_000_000;

export type JsonBody<T> = { ok: true; data: T } | { ok: false; response: Response };
export type BytesBody = { ok: true; data: Uint8Array } | { ok: false; response: Response };

/** Read any body type with a streaming ceiling (Content-Length is advisory). */
export async function readBytesBody(request: Request, maxBytes: number, allowEmpty = false): Promise<BytesBody> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, response: Response.json({ error: "request body is too large" }, { status: 413 }) };
  }
  if (!request.body) {
    return allowEmpty ? { ok: true, data: new Uint8Array() } : { ok: false, response: Response.json({ error: "a request body is required" }, { status: 400 }) };
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return { ok: false, response: Response.json({ error: "request body is too large" }, { status: 413 }) };
    }
    chunks.push(value);
  }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
  return { ok: true, data };
}

export async function readTextBody(request: Request, maxBytes: number, allowEmpty = false): Promise<{ ok: true; data: string } | { ok: false; response: Response }> {
  const result = await readBytesBody(request, maxBytes, allowEmpty);
  return result.ok ? { ok: true, data: new TextDecoder().decode(result.data) } : result;
}

/** Parse JSON without allowing a chunked request to grow unbounded in memory. */
export async function readJsonBody<T = Record<string, unknown>>(request: Request, maxBytes = DEFAULT_JSON_LIMIT): Promise<JsonBody<T>> {
  const result = await readBytesBody(request, maxBytes);
  if (!result.ok) return result;
  try {
    const data = JSON.parse(new TextDecoder().decode(result.data)) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, response: Response.json({ error: "request body must be a JSON object" }, { status: 400 }) };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, response: Response.json({ error: "request body must be valid JSON" }, { status: 400 }) };
  }
}
