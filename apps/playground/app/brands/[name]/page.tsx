import type { BrandSpec } from "@brandrail/spec";
import { notFound, redirect } from "next/navigation";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { BrandWorkspace } from "./workspace";

export default async function BrandPage({ params }: { params: Promise<{ name: string }> }) {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const { name } = await params;
  const [specRes, usageRes, renderRes, genRes] = await Promise.all([
    engine(`/v0/specs/${encodeURIComponent(name)}`, {}, uid),
    engine("/v0/me/usage", {}, uid),
    engine("/v0/renders?limit=100", {}, uid),
    engine("/v0/generative/config", {}, uid),
  ]);
  if (!specRes.ok) notFound();
  const { spec } = (await specRes.json()) as { spec: BrandSpec };
  const usage = usageRes.ok ? await usageRes.json() as { role: "owner" | "reviewer"; counts: { generativeThisMonth: number }; genLimit: number } : { role: "owner" as const, counts: { generativeThisMonth: 0 }, genLimit: 0 };
  const all = renderRes.ok ? await renderRes.json() as { renders: Array<{ id: string; createdAt: string; manifest: { brand: string; brief: string; assets: Array<{ filename: string; format: string }> } }> } : { renders: [] };
  const gen = genRes.ok ? await genRes.json() as { configured: boolean } : { configured: false };
  return <BrandWorkspace initialSpec={spec} owner={usage.role === "owner"} genUsed={usage.counts.generativeThisMonth} genLimit={usage.genLimit} genConfigured={gen.configured} renders={all.renders.filter((r) => r.manifest.brand === name)} />;
}
