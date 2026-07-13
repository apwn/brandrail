# Licensing

Brandrail is **open-core**. The pieces a developer embeds are permissive
(MIT); the app you'd otherwise clone-and-close is copyleft (AGPL-3.0).

| Path | License | Why |
|---|---|---|
| `packages/spec` | **MIT** | The BrandSpec format is a standard — embed it anywhere, zero friction. |
| `packages/sdk` | **MIT** | Ship it inside your product. |
| `packages/cli` | **MIT** | Wrap it, vendor it, redistribute it. |
| `packages/mcp` | **MIT** | Point any agent at it. |
| `apps/playground` and everything else in this repo | **AGPL-3.0** | The rails/app are copyleft: run a modified version as a network service and you must share your changes. Keeps a competitor from taking the app closed-source. |

- Each MIT package carries its own `LICENSE` and declares `"license": "MIT"` in
  `package.json`, so npm and tooling resolve it correctly per-package.
- The repository-level `LICENSE` is the AGPL-3.0 (it governs the app). `LICENSE-MIT`
  is the shared MIT text the packages point at.
- The **rendering/compiling engine** (compile, render, art-director gate) is a
  separate, closed component and is **not** in this repository.

Not legal advice — just how the code is licensed. Questions: open an issue.
