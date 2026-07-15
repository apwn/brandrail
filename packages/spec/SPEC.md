# BrandSpec v0.1

**Status:** Draft · **License:** MIT · **Canonical schema URL:** `https://brandrail.dev/spec/v0.1.json`

A BrandSpec is a machine-readable definition of how a brand thinks visually. It is the contract between anything that *plans* content (humans, LLMs, agents) and anything that *renders* it. A renderer that speaks BrandSpec can guarantee its output is on-brand; a violation is a build error, not a warning.

The key words MUST, MUST NOT, SHOULD, and MAY are to be interpreted as described in RFC 2119.

## 1. Design goals

1. **Portable.** A spec is a single JSON document with no runtime dependencies. Any renderer that implements this document can consume any spec.
2. **Deterministic.** Identical spec content MUST serialize to identical bytes (§7). No timestamps, no environment-dependent values in the body.
3. **Versionable and diffable.** Specs are git-native. A brand refresh is a pull request; the semantic diff (§8) is the review artifact.
4. **Forkable.** An agency master spec forks into per-client children with recorded lineage (§9).
5. **Enforceable.** Every field exists to be *checked*, not merely stored. Fields that cannot be enforced by a renderer or copy validator do not belong in the spec.

## 2. Document structure

A BrandSpec is a JSON object with exactly these top-level members, in canonical order:

| Member | Required | Purpose |
|---|---|---|
| `$schema` | yes | MUST be the canonical schema URL above |
| `meta` | yes | Name, version, lineage, provenance |
| `identity` | yes | Colors, typography, logo, spacing and visual language — the mechanical layer |
| `composition` | no* | Layout constraints: density, archetypes, whitespace, alignment |
| `imagery` | no* | Photography/illustration/icon rules, generative fences |
| `voice` | no* | Tone, banned/required vocabulary, emoji/hashtag/CTA policy |
| `judgment` | no* | Positive/negative examples and prompt snippets — the taste layer |

\* Omitted sections take the documented defaults. A validating parser MUST materialize defaults so that two specs with the same effective content are byte-identical after canonicalization.

## 3. `meta`

```jsonc
{
  "name": "acme",              // kebab-case slug, unique per workspace
  "version": 3,                // positive integer; MUST be bumped on every content change
  "forkedFrom": null,          // or { "name": "agency-master", "version": 2 }
  "compiledFrom": {            // provenance; null for hand-written specs
    "type": "url",             // "url" | "manual" | "figma" | "canva" (figma/canva reserved for V1)
    "source": "https://acme.com",
    "at": "2026-07-07"         // ISO date only — never a timestamp (§7)
  }
}
```

`version` identifies spec *content*, not schema. Schema evolution is carried by `$schema` and handled by `migrate()`.

## 4. `identity` — the mechanical layer

### 4.1 Colors

Colors are declared as **roles**, not palettes. The four core roles:

- `ink` — primary text/foreground
- `paper` — primary background
- `signal` — the accent; scarce by design
- `muted` (optional) — secondary text

Additional named roles MAY be added (catchall); all values MUST be 6-digit hex, canonically uppercase.

`usage` carries enforceable constraints:

- `signalMaxAreaPct` — maximum share of canvas area the signal color may occupy (default 15). Renderers MUST fail a layout that exceeds it.
- `minContrast` — minimum WCAG contrast ratio for any text/background pair (default 4.5). A spec whose `ink`/`paper` pair fails this is **invalid** — it cannot render legible text at all.

### 4.2 Typography

`display` and `body` font declarations: `family`, `weights` (at least one), `fallback` (generic family), `case` (`none` | `upper` | `title`), `trackingEm`. `scale` declares a modular scale `ratio` and `minBodyPx` — renderers MUST NOT set body text below `minBodyPx`.

### 4.3 Logo

`assets.primary` / `assets.mark` are optional asset references (`blob://`, `https://`, or `data:`). When absent, renderers MUST degrade to a set-in-brand-type wordmark, never to a placeholder image. `clearspace`, `minSizePx`, `allowedOn` (color roles the logo may sit on), and `distort: false` (always) are enforced at render time.

### 4.4 Spacing

`unit` (px, default 8) and `grid` (`12col` | `8col` | `4col`). All template padding, gaps and offsets MUST be integer multiples of `unit`.

### Visual language

`identity.visualLanguage` describes the brand's reusable visual grammar rather
than one specific layout: `family` (editorial, modular, image-led), corner and
border character, background strategy, image treatment, logo treatment and
color balance. All fields are optional with conservative defaults, so older
v0.1 specs remain valid. Renderers SHOULD use these tokens to choose between
deterministic variants without inventing decorative styles.

## 5. `composition`, `imagery`

- `densityMaxElementsPerZone` — hard cap on distinct visual elements per layout zone.
- `layoutArchetypes` — the closed set of layouts this brand permits, drawn from: `hero-statement`, `split-stat`, `quote`, `list-3`, `cta-card`, `promo-card`, `feature-grid`, `testimonial`, `announcement`, `before-after`. Requesting a non-listed archetype is a violation (`archetype-not-allowed`).
- `whitespaceMinPct` — minimum share of the canvas free of content.
- `alignment` — `left` | `center` | `mixed`.
- `imagery.photos` — the brand's own photography (max 12), either an asset reference or `{ ref, alt, context, tags }`. Metadata lets deterministic renderers choose a relevant image instead of matching only geometry. This is the **only** imagery a renderer may place, and photos occupy dedicated zones: text MUST NOT render over a photo (contrast against arbitrary pixels cannot be enforced). Renderers MUST honor `imagery.photography.allowed: false` by ignoring this list.
- `imagery.aiFences` — where generative fill is permitted. In v0.1 `subjects` MUST be `false`: generated backgrounds may be fenced in; generated subjects are never allowed.

## 6. `voice` and `judgment`

`voice` is enforced on copy *before* rendering: `banned` (case-insensitive substring match), `required`, `emojiMax`, `hashtagMax`, `ctaStyle`. Copy that violates voice MUST NOT reach the renderer.

`judgment` is the taste layer consumed by LLM steps, not by the renderer: `positive` / `negative` examples (`{ note, ref }`) and `promptSnippets` injected verbatim into copywriting prompts.

## 7. Canonical serialization

`stringify()` MUST produce identical bytes for identical content:

1. Object keys appear in **schema declaration order**; keys not declared by the schema (extra color roles, forward-compat fields) sort alphabetically after declared keys.
2. Arrays preserve author order — order is meaningful (archetype preference, tone priority).
3. 2-space indentation, `\n` line endings, one trailing newline.
4. Hex colors are uppercase. Dates are `YYYY-MM-DD` — timestamps are forbidden anywhere in the body.

## 8. Diffing

`diff(a, b)` compares canonicalized specs and returns `{ op: added | removed | changed, path, from, to }` entries. `meta.version` is excluded — a bump is the *consequence* of a diff. `formatDiff()` renders entries grouped by section for human review.

## 9. Forking

`fork(parent, name, overrides)` produces a child spec: deep-merged objects, **wholesale-replaced arrays** (a fork that touches an array owns it), `meta = { name, version: 1, forkedFrom: { parent name, parent version }, compiledFrom: parent's }`. The result MUST validate; an invalid fork throws.

## 10. Violations

Renderers and copy validators MUST throw a structured `SpecViolationError` — never emit degraded output. Violation codes: `font-mismatch`, `contrast`, `density`, `whitespace`, `banned-word`, `required-word-missing`, `emoji-max`, `hashtag-max`, `cta-style`, `logo-misuse`, `clearspace`, `min-size`, `signal-area`, `overflow`, `archetype-not-allowed`, `raw-design-value`.

## 11. Schema evolution

Breaking changes bump the `$schema` URL (v0.2, …). Implementations MUST refuse unknown schema URLs rather than guess. `migrate()` upgrades documents along a chain of registered upgraders.

## 12. Reference implementation

This package (`@brandrail/spec`, MIT) is the reference implementation: Zod schemas, inferred TypeScript types, `validate` / `parse`, `stringify` / `canonical`, `diff` / `formatDiff`, `fork`, `migrate`, `SpecViolationError`, format definitions, and WCAG color math.
