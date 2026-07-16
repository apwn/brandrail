import { engineJson, isVerifiedUser } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

const anonymousRestyles = new Map<string, number>();

export async function POST(req: Request) {
  const parsed = await readJsonBody<Record<string, unknown>>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  if (!body?.brand || !body?.brief) {
    return Response.json({ error: "brand and brief required" }, { status: 400 });
  }
  const uid = await ensureUserId();
  const isRestyle = Array.isArray(body.formats) && body.formats.length === 1 && Boolean(body.recipe || body.templateRef || body.template || body.templates || body.archetype || body.copy || body.modifications || body.media);
  let reservedAnonymousRestyle = false;
  if (isRestyle && !(await isVerifiedUser(uid))) {
    const used = anonymousRestyles.get(uid) ?? 0;
    if (used >= 2) return Response.json({ error: "Sign in free to keep restyling and save this workspace." }, { status: 403 });
    anonymousRestyles.set(uid, used + 1);
    reservedAnonymousRestyle = true;
  }
  const result = await engineJson("/v0/render", {
    method: "POST",
    body: JSON.stringify({
      brand: body.brand,
      brief: body.brief,
      ...(body.recipe ? { recipe: body.recipe } : {}),
      ...(body.formats ? { formats: body.formats } : {}),
      ...(body.template ? { template: body.template } : {}),
      ...(body.templateRef ? { templateRef: body.templateRef } : {}),
      ...(body.templates ? { templates: body.templates } : {}),
      ...(body.archetype ? { archetype: body.archetype } : {}),
      ...(body.modifications ? { modifications: body.modifications } : {}),
      ...(body.media ? { media: body.media } : {}),
      ...(body.copy ? { copy: body.copy } : {}),
      ...(body.replaceRenderId ? { replaceRenderId: body.replaceRenderId } : {}),
      ...(body.runId ? { runId: body.runId } : {}),
    }),
  }, uid);
  if (reservedAnonymousRestyle && result.status >= 400) {
    const used = anonymousRestyles.get(uid) ?? 1;
    if (used <= 1) anonymousRestyles.delete(uid);
    else anonymousRestyles.set(uid, used - 1);
  }
  return Response.json(result.data, { status: result.status });
}
