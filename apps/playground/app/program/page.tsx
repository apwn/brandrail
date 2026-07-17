import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceHeader } from "../components/workspace-header";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { ContentProgramWorkspace, type ChannelOption, type ContentProgram } from "./workspace";

export const metadata: Metadata = { title: "Content program · Brandrail" };

async function read<T>(path: string, uid: string, fallback: T): Promise<T> {
  try { const response = await engine(path, {}, uid); return response.ok ? await response.json() as T : fallback; } catch { return fallback; }
}

export default async function ContentProgramPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login?return=%2Fprogram");
  const usage = await read<{ role: "owner" | "reviewer"; user: { plan: "free" | "studio" | "agency" }; entitlements: { features: string[] } }>("/v0/me/usage", uid, { role: "owner", user: { plan: "free" }, entitlements: { features: [] } });
  if (usage.role !== "owner") return <LockedProgram />;
  const canActivate = usage.entitlements.features.includes("autopilot");
  const [specs, channels, programs] = await Promise.all([
    read<{ specs: Array<{ name: string; active?: boolean }> }>("/v0/specs", uid, { specs: [] }),
    read<{ channels: ChannelOption[] }>("/v0/channels", uid, { channels: [] }),
    canActivate ? read<{ programs: ContentProgram[] }>("/v0/content-programs", uid, { programs: [] }) : Promise.resolve({ programs: [] as ContentProgram[] }),
  ]);
  const brands = specs.specs.filter((spec) => spec.active !== false).map((spec) => spec.name);
  return <ContentProgramWorkspace brands={brands} channels={channels.channels} initialPrograms={programs.programs} canActivate={canActivate} />;
}

function LockedProgram() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <WorkspaceHeader context="Content plan" active="plan" />
      <section className="max-w-3xl py-14">
        <div className="rail w-14" />
        <p className="eyebrow mt-6 text-signal">OWNER-LED STRATEGY</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">The workspace owner controls the content plan.</h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-muted">Reviewers can inspect brand systems and work approval queues, while strategy, automation and publishing settings remain owner-only.</p>
        <a href="/dashboard" className="btn mt-8">Return to workspace →</a>
      </section>
    </main>
  );
}
