---
name: chainguard-frontend-design
description: Design system and coding conventions for the ChainGuard (SIH26125 / BEL) frontend, derived directly from the DecentraVault prototype (audit-log-prototype-1.html). Use this whenever writing, reviewing, or asking Claude for code for ANY ChainGuard page — Login, Dashboard, Asset Request, Risk Decision, Audit Log, or Admin/Approvals — so colors, typography, component markup, loading/empty/error states, and the mock-API pattern stay identical across Abdullah's, Safeer's, and Nazima's pages instead of drifting into four different look-and-feels. Also trigger this for anything mentioning ChainGuard, DecentraVault, ClassificationBadge, RiskGauge, FactorBar, Navbar, or the Day 6 mock-API-layer task.
---

# ChainGuard Frontend Design System

## Why this file exists

The master spec (Section 7) already has everyone paste a "Shared Claude
Prompt" before asking for backend/chaincode code, so six people don't get
six incompatible versions of the blockchain layer. This file is the
**frontend equivalent** — it's the shared-conventions doc Ayush's Day 1
task ("set shared conventions: component naming, folder structure, Tailwind
class patterns to reuse") calls for, and what Day 2's plan-review and
Day 3-4 shared-component change log should be checked against.

**How to use it:** paste this whole file (or point Claude at it) before
asking for code for any ChainGuard page. Pair it with the master spec's
Shared Claude Prompt — that one covers architecture/versions, this one
covers *how the UI should look and behave*.

**Source of truth:** `audit-log-prototype-1.html` (the DecentraVault
Audit Log + Approvals screen) is the canonical reference implementation.
When this doc and the prototype ever disagree, the prototype wins — open
it and copy the actual class names and markup rather than inventing new
ones. The exhaustive, copy-pasteable version of everything below (full
CSS variable block, every component's markup) lives in
`references/design-system.md`.

## Brand

- Product name shown in the UI: **DecentraVault**
- Tagline: **Security Control Plane**
- Logo: a small teal rounded-square "shield" mark (see prototype `.brand-mark`), 22×22px, top-left of the sidebar.

## Design tokens — never hardcode a color

Every color is a CSS custom property on `:root`, redefined for dark mode
via `@media (prefers-color-scheme: dark)` plus explicit
`[data-theme="dark"]` / `[data-theme="light"]` overrides. **Always write
`var(--token)` in new CSS, never a hex code** — that's the only way all
four pages stay theme-consistent automatically.

| Token | Use |
|---|---|
| `--bg` / `--surface` / `--surface-2` / `--surface-3` | Page background, card background, and two levels of "recessed" surface (hover states, table stripes) |
| `--border` / `--border-strong` | Default hairline borders / emphasized borders (focus, hover) |
| `--text` / `--text-dim` / `--text-faint` | Primary / secondary / tertiary text hierarchy |
| `--accent` / `--accent-soft` / `--accent-strong` | Brand teal — links, active nav, primary actions, and the "Endorsed" outcome |
| `--allow` / `--allow-soft` | Green — Allow outcome |
| `--stepup` / `--stepup-soft` | Amber — Step-Up outcome, in-progress endorsement |
| `--block` / `--block-soft` | Red — Block outcome, destructive/error actions |
| `--endorsed` / `--endorsed-soft` | Same value as accent — fully-endorsed state |

Every `-soft` variant is a pale tint used as a badge/tag *background*,
paired with the full-strength color as the *text/icon* color. This is the
only pattern used for status color anywhere in the app — don't invent a
new way to color-code a status.

## Typography

- **UI text:** `Inter` (400/500/600/700), loaded from Google Fonts, with a system-font fallback stack.
- **Monospace:** `IBM Plex Mono` (400/500/600) — used for **anything that's an identifier**: asset IDs, DIDs, transaction hashes, timestamps in tables, request IDs. If a value is something a user would copy-paste or verify against a block explorer, it's mono.
- Base body size is `13.5px` / `line-height: 1.5` — this is a dense, data-heavy console UI, not a marketing page. Don't scale text up "for readability"; use the existing size scale (10px eyebrow labels → 21px metric numbers is the full range used).

## Layout shell

- Fixed **232px sidebar** + fluid main content, `display: grid; grid-template-columns: 232px 1fr`.
- Collapses to a single column below **860px** (sidebar nav groups hide; keep the brand row).
- Main content area: `max-width: 1180px`, padding `20px 26px 60px` (`14px 14px 48px` on mobile).
- Sidebar groups: an ungrouped item, then labeled groups (`Security`, `Assets`, `Organizations`, `System` in the prototype — rename groups but keep the pattern). Each nav item has an icon + label; not-yet-built pages get a `disabled` state with a "Soon" tag rather than being omitted, so the full planned nav is always visible.

## Core components (see references/design-system.md for exact markup)

| Component | What it's for | Used by |
|---|---|---|
| `.page-head` | Page title + one-line description + right-aligned status block (environment pill, "last updated") | Every page |
| `.metric-card` row (4-up grid) | Top-of-page KPI summary with a colored dot per metric | Dashboard, Audit Log |
| `.toolbar` / `.field` | Filter bar: search field (with inline icon), selects, date range, a right-aligned "Clear filters" button | Audit Log, Dashboard, Admin approvals |
| `.panel` + `.log-row` grid | Row-based data table with a 2px outcome-colored left border per row, a distinct `.head` row, and a card-stacking fallback below 720px | Audit Log, Asset Request history |
| `.badge` (`Allow` / `Step-Up` / `Block` / `Endorsed`) | The **only** status-color component in the app — soft background, strong text, small leading dot | Risk Decision outcome, Audit Log outcome column |
| `.class-tag` | Bordered, neutral pill for classification level (Public/Internal/Confidential/Restricted) — deliberately *not* color-coded like `.badge`, since classification and outcome are different axes | Everywhere an asset's classification is shown |
| `.org-row` + `.progress-track`/`.progress-fill` | Per-org endorsement checklist + an overall "N of M orgs approved" progress bar | Admin approvals, Risk Decision step-up state |
| `.drawer` | Right-side slide-in detail panel (380px, `detail-row` key/value list) for "view one record" | Audit Log row click, Approvals "Review Request" |
| `.modal` | Centered dialog for settings-style interactions (dev mode toggles) | Anything that isn't "detail about one record" — use drawer for that instead |
| `.toast` | Bottom-center, auto-dismissing (~1.7s) confirmation after an action | Copy tx hash, org approval, any fire-and-forget confirmation |
| `.empty-state` / `.skeleton-row` / `.error-state` | The three non-happy-path states every async view must have, see checklist below | Every list/detail view |

## Mapping onto each person's pages

- **Abdullah (Login, Dashboard):** reuse `.page-head` + `.metric-card` row + `.empty-state` (zero owned assets) + skeleton loading during wallet connect + the `disabled`/`soon-tag` nav pattern for role gating.
- **Safeer (Asset Request, Risk Decision):** `RiskGauge` and the Allow/Step-Up/Block outcome styling should use the exact same three semantic colors and soft/strong pairing as `.badge` — don't pick new colors for the risk gauge. `FactorBar` (per-factor breakdown) should follow the same track/fill visual language as `.progress-track`/`.progress-fill`. The step-up "waiting for signature" state and the endorsement-pending state (Days 9-10) are both good fits for the `.org-row`/progress pattern already built for Admin approvals.
- **Nazima (Audit Log, Admin approval views):** the attached prototype **is** your page — reuse its markup, CSS, and JS structure close to verbatim rather than rebuilding it.
- **Ayush (shared components — `ClassificationBadge`, `RiskGauge`, `FactorBar`, `Navbar`):** `ClassificationBadge` = `.class-tag`, `Navbar`/shell = `.side` + `.nav-item`, `RiskGauge`/`FactorBar` = the `.progress-track` family. Keep these in one shared CSS/theme file that all four pages import, so a token or component tweak only ever happens in one place — this is what your Day 3-4 "shared-component change log" is tracking.

## Mock API pattern (everyone builds this on Day 6)

Every data call is an `async` function that awaits an artificial
`delay(ms)`, reads/writes an in-memory seed array, and returns exactly the
shape the real backend contract (from Avikrit on Day 6) will return — so
swapping in a real `fetch()` call on Days 7-8 doesn't touch any calling
code:

```js
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function getAccessLogs(filters) {
  await delay(280);           // simulate network latency deliberately
  let rows = [...seedLogs];
  // ...apply filters exactly the way the real endpoint's query params will...
  return rows;
}
```

See `references/design-system.md` for the full mock-layer template
(filtering, mutation, and error-simulation patterns) used in the
prototype.

## State-handling checklist (apply to every list/detail view, no exceptions)

1. **Loading** → render `skeletonRows(n)` shimmering placeholder bars, never a blank panel.
2. **Success, has data** → render the real rows/cards.
3. **Success, zero rows** → `.empty-state`: icon + bold one-line title + one sentence of copy + (if applicable) an action button, e.g. "Clear filters".
4. **Failure** → `.error-state`: icon + bold title + the error message + a **Retry** button that re-calls the exact same render function.

If a view is missing any of these four, it's not done — this is exactly
what the prototype's `renderLog()` does and what the Day 9-10 network-
throttling tests (Abdullah) and endorsement-pending state (Safeer) are
checking for.

## Interaction conventions

- A single `openPanel(id)` / `closeAllPanels()` pair drives every drawer and modal — overlay click, the Escape key, and any explicit close button all route through `closeAllPanels()`. Don't wire per-component close logic.
- Toasts are for one-off confirmations only (copy succeeded, org approved) — never for errors that need a retry action; those go in `.error-state` instead.
- Never use browser `alert()` / `confirm()` / `prompt()` — there's a drawer, modal, or toast pattern for every case that would otherwise reach for one.

## PR / consistency checklist (for Ayush's Day 2-4 review pass)

Before merging any page or shared-component change, confirm:

- [ ] Colors are `var(--token)`, never a hardcoded hex.
- [ ] Any ID/hash/timestamp uses the mono font class, not the default UI font.
- [ ] A genuinely new shared component (not covered above) is added to `references/design-system.md` **and** flagged to the whole team before merging — per the master spec's "nobody restructures/changes shared things without telling the team" rule.
- [ ] All four view-states (loading/success/empty/error) exist for any new async view.
- [ ] Status color communicates outcome (`.badge`) — classification uses the neutral `.class-tag`, not a color-coded badge.
