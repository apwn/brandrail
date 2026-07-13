# Contributing to Brandrail

Thanks for helping kill slop. Brandrail is built in public and PRs are welcome.

## Ground rules that make this project work

1. **Templates consume BrandSpec tokens only.** Hardcoded colors, fonts, or
   sizes are lint/review errors. If you need a value, it belongs in the spec.
2. **Determinism is sacred.** The same spec + copy must render byte-identical
   PNGs. If your change affects rendering, keep the determinism tests green.
3. **Violations are build errors, not warnings.** Don't downgrade a
   `SpecViolationError` to make output "just render" — fix the input or the
   template.
4. **Agents are first-class users.** New surface should be reachable from the
   SDK/CLI/MCP with `--json`/structured output and stable exit codes.

## Dev setup

```sh
pnpm install
pnpm build     # spec → sdk → cli → mcp
pnpm test
```

The packages and playground expect a rendering engine at `BRANDRAIL_API_URL`
(default `http://localhost:4747`). The engine itself is a separate, closed
component — most contributions here (spec, SDK, CLI, MCP, playground UI,
templates, docs) don't need it running, and the spec test suite runs offline.

## Before you open a PR

- `pnpm test` passes and `pnpm -r typecheck` is clean.
- New behavior has a test. Bug fixes have a regression test.
- Commits are focused; the PR description says what and why.
- If you touched a template, note whether it still clears the art-director gate.

## Licensing of contributions

By contributing you agree your changes are licensed under the same terms as the
file you changed — **MIT** for `packages/*`, **AGPL-3.0** for the app. See
[`LICENSING.md`](LICENSING.md).

## Security

Please don't file security issues in public — see [`SECURITY.md`](SECURITY.md).
