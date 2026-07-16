import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { SettingsPanel } from "./settings-panel";
import { WorkspaceLockup } from "../components/workspace-lockup";

/** Account settings: identity, email (change = re-verify), danger zone. */
export default async function Settings() {
  const uid = await getUserId();
  if (!uid) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20">
        <a href="/" className="eyebrow hover:text-bone">← BRANDRAIL</a>
        <h1 className="font-display font-bold text-3xl mt-6">Settings</h1>
        <p className="text-muted mt-3">No session. <a className="text-signal" href="/">Start on the homepage →</a></p>
      </main>
    );
  }

  let user: { id: string; email: string | null; emailVerified?: boolean; plan: string } = { id: uid, email: null, plan: "free" };
  let role: "owner" | "reviewer" = "owner";
  try {
    const res = await engine("/v0/me/usage", {}, uid);
    if (res.ok) {
      const data = (await res.json()) as { user: typeof user; role?: "owner" | "reviewer" };
      user = data.user;
      role = data.role ?? "owner";
    }
  } catch {
    /* engine down — show what we have */
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="flex items-center gap-3">
        <WorkspaceLockup context="Settings" />
        <a href="/dashboard" className="eyebrow text-muted hover:text-bone ml-auto">← WORKSPACE</a>
      </header>
      {role === "reviewer" ? (
        <section className="panel p-5 mt-10">
          <p className="eyebrow text-bone">REVIEWER ACCOUNT</p>
          <p className="text-muted text-sm mt-2">Your identity is <b className="text-bone">{user.email}</b>. Workspace billing, credentials, member access and deletion are controlled by the owner.</p>
        </section>
      ) : <SettingsPanel email={user.email} verified={Boolean(user.emailVerified)} plan={user.plan} uid={user.id} />}
    </main>
  );
}
