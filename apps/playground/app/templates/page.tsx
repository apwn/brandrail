import { ARCHETYPE_INFO, type CustomTemplateFamily } from "@brandrail/spec";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { redirect } from "next/navigation";
import { TemplateWorkspace } from "./workspace";

export default async function TemplatesPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const [familiesRes, specsRes, usageRes] = await Promise.all([
    engine("/v0/template-families", {}, uid),
    engine("/v0/specs", {}, uid),
    engine("/v0/me/usage", {}, uid),
  ]);
  const families = familiesRes.ok ? await familiesRes.json() as { families: CustomTemplateFamily[] } : { families: [] };
  const specs = specsRes.ok ? await specsRes.json() as { specs: Array<{ name: string }> } : { specs: [] };
  const usage = usageRes.ok ? await usageRes.json() as { role?: "owner" | "reviewer" } : {};
  return <TemplateWorkspace initialFamilies={families.families} brands={specs.specs.map((spec) => spec.name)} systemTemplates={ARCHETYPE_INFO} owner={usage.role !== "reviewer"} />;
}
