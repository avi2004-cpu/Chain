---
name: chainguard-frontend-design
description: Design system and coding conventions for the ChainGuard (SIH26125 / BEL) frontend — now a dark, security-operations visual identity modeled on the OFFENSAI marketing/product UI (screen-recorded 2026-09-18), layered on top of the original DecentraVault component set (audit-log-prototype-1.html). Use this whenever writing, reviewing, or asking Claude for code for ANY ChainGuard page — Login, Dashboard, Asset Request, Risk Decision, Audit Log, or Admin/Approvals — so colors, typography, the risk-score gauge, and every other component stay identical across Abdullah's, Safeer's, and Nazima's pages. Trigger this for anything mentioning ChainGuard, DecentraVault, OFFENSAI-style, ClassificationBadge, RiskGauge, FactorBar, Navbar, or the Day 6 mock-API-layer task.
---

# ChainGuard Frontend Design System

## Why this file exists, and what changed

This is still the single shared-conventions doc from Ayush's Day 1 task
("set shared conventions... so component naming and class patterns don't
drift across four people"). **What changed:** the team reviewed OFFENSAI
(offensai.com — a cloud-attack-validation product) as a visual reference,
and ChainGuard's console is moving from the original light "DecentraVault"
theme to a **dark, security-operations look** in that spirit. The brand
name, page structure, and every behavioral pattern (mock API, state
handling, drawer/modal/toast) from the original prototype are unchanged —
only the color system, typography weight, and a few new component
patterns (risk-score gauge, step process, node diagram) are new.

**How to use it:** paste this whole file before asking for code for any
ChainGuard page. The exhaustive, copy-pasteable version of everything
below lives in `references/design-system.md` — read that before writing
CSS from scratch.

**Source of truth:** where this doc and the original
`audit-log-prototype-1.html` disagree on *color or typography*, this doc
wins (that's the point of the update). Where they'd disagree on
*behavior* (state handling, drawer/modal pattern, mock API shape), the
prototype still wins — that layer didn't change.

**Latest addition:** the sidebar, drawer, modal, and toast now use an
iOS-style frosted-glass treatment (blur + translucent tint) instead of a
flat dark panel — see `.glass-bar`/`.glass-floating` below and section 3B
of the reference doc. This is layered on top of everything else here, not
a replacement — data panels and tables are deliberately left opaque.

## Brand

- Product name shown in the UI: **DecentraVault** (unchanged)
- Tagline: **Security Control Plane** (unchanged)
- Visual identity: dark, technical, "security-operations" — near-black
  surfaces, a blue primary accent, a red/crimson secondary accent used
  for alerts and emphasis, bold high-contrast headlines. Think "SOC
  dashboard," not "light SaaS admin panel."

## Design tokens — never hardcode a color

Everything is a CSS custom property on `:root`. **Always write
`var(--token)`, never a hex code.**

| Token | Use |
|---|---|
| `--bg` | Page background — near-black, not pure black |
| `--surface` / `--surface-2` / `--surface-3` | Card background / recessed surface (hover, stripes) / most-recessed (skeleton shimmer, track backgrounds) |
| `--border` / `--border-glow` | Default hairline border / the glowing blue border used on emphasized cards (see prototype's first "why" card, hovered nav items) |
| `--text` / `--text-dim` / `--text-faint` | Primary (near-white) / secondary / tertiary text hierarchy |
| `--accent` / `--accent-soft` / `--accent-strong` | Primary blue — buttons, links, active states, glow effects |
| `--danger` / `--danger-soft` | Red/crimson — used for numbered step badges, alert-count dots on nodes, and anywhere something needs to read as "attacker's-eye-view" emphasis, not just a form-validation error |
| `--allow` / `--allow-soft` | Green — Allow outcome |
| `--stepup` / `--stepup-soft` | Amber — Step-Up outcome, in-progress endorsement |
| `--block` / `--block-soft` | Red — Block outcome (same hue family as `--danger`, distinct token because it's semantic app state, not decorative) |
| `--endorsed` / `--endorsed-soft` | Same value as `--accent` — fully-endorsed state |
| `--tier-critical` / `--tier-high` / `--tier-medium` / `--tier-low` / `--tier-info` | A 5-step severity gradient (red → orange → gold → green → gray-blue), for anywhere ChainGuard shows a *graduated* score or tier rather than a 3-way outcome — this is new, modeled on OFFENSAI's Critical/High/Medium/Low/Info legend, and is the palette the risk-score gauge and factor table use |

Every `-soft` variant is a pale-on-dark tint used as a background behind
the full-strength color as text/icon — same badge pattern as before, just
re-tuned for a dark base instead of a light one.

## Typography

- **UI text:** `Inter`. Body copy stays regular/medium weight and dense
  (`13.5px`, unchanged from before — this is still a data-heavy console,
  not a marketing page). **Headlines get heavier:** page titles and
  section headers move to weight 700-800 with tighter letter-spacing,
  matching OFFENSAI's bold display headlines — the contrast between
  "bold heading, small dense body" is the visual signature to copy.
- **Monospace:** `IBM Plex Mono` — unchanged, still every ID/hash/timestamp.

## Core components (see references/design-system.md for exact markup)

Everything from the original system still applies (`.page-head`,
`.metric-card`, `.toolbar`/`.field`, `.panel`/`.log-row`, `.badge`,
`.class-tag`, `.org-row`/`.progress-track`, `.drawer`, `.modal`,
`.toast`, `.empty-state`/`.skeleton-row`/`.error-state`) — just recolored
onto the dark palette. **New, added from the OFFENSAI reference:**

| Component | What it's for | Used by |
|---|---|---|
| `.risk-gauge` (ring/donut) + `.factor-table` | A circular score gauge with a colored arc (using the `--tier-*` scale) plus a weighted-factor breakdown table below it — directly modeled on OFFENSAI's "AVERAGE CSIR SCORE" ring + "SCORE CALCULATION" table | **This is `RiskGauge` + `FactorBar` — Safeer's Risk Decision screen** |
| `.step-process` | Numbered circular badges (in `--danger`) connected by a horizontal line, with a title + description under each step | Any onboarding/explainer content; also a good fit for narrating the request→risk→endorsement→log flow in a demo/pitch view |
| `.glow-card` | Dark card with a circular glowing icon badge, bold heading, gray body — the "why/trust" card pattern | An "About this system" or capability-summary panel on the Dashboard |
| `.node-diagram` | Icon-badge nodes connected by thin glowing lines in a circuit-board layout, with a small alert-count dot on nodes that have findings | The currently-`disabled`/"Soon" nav items — **Asset Inventory, Organizations, Endorsements** — this is the natural component to build those with once they're no longer "Soon" |
| `.pill-tabs` | A light, rounded tab bar where the active tab is a solid filled pill | An alternate/upgraded look for any in-page tab switcher (e.g. Audit Log vs Approvals, if it moves out of the sidebar) |
| `.screen-frame` | A "browser chrome" (three dots) wrapper for embedding a preview/screenshot of another view inside a card | Any place one page needs to preview another (e.g. Nazima's Admin view previewing a pending request's detail) |
| `.glass-bar` / `.glass-floating` | iOS-style frosted glass — blur + translucent tint + a specular top highlight, plus a subtle colored background wash behind the whole app for the blur to pick up. **Chrome only, never data:** sidebar and any sticky toolbar get `.glass-bar`; drawer, modal, and toast get `.glass-floating`. Every `.panel`, `.metric-card`, `.log-row`, and `.factor-table` stays opaque — glass under dense text/tables hurts legibility instead of looking premium. | Ayush (sidebar), and whoever owns each drawer/modal/toast instance |

## Mapping onto each person's pages

- **Abdullah (Login, Dashboard):** dark `.page-head` + `.metric-card` row + `.empty-state` + skeleton loading — same structure as before, recolored. Consider a `.glow-card` "capability summary" strip on the Dashboard.
- **Safeer (Asset Request, Risk Decision):** **use `.risk-gauge` + `.factor-table` for RiskGauge/FactorBar** instead of a generic progress bar — this is the single biggest visual upgrade from the OFFENSAI reference and it maps almost one-to-one onto what Risk Decision already needs (an overall score + a per-factor weighted breakdown). Keep `.badge` Allow/Step-Up/Block exactly as-is for the outcome itself; the gauge explains *why*, the badge states *what*.
- **Nazima (Audit Log, Admin approvals):** structure is unchanged (still the prototype's markup, just recolored). If/when Endorsements or Organizations come out of "Soon," build them with `.node-diagram`.
- **Ayush (shared components):** `ClassificationBadge` = `.class-tag`, `Navbar` = `.side`/`.nav-item`, `RiskGauge`/`FactorBar` = the new `.risk-gauge`/`.factor-table` pair. Keep the token file as the one place anyone touches color.

## Mock API pattern, state-handling checklist, interaction conventions

**Unchanged from before** — these are behavioral, not visual:

- Every data call is `async`, awaits an artificial `delay(ms)`, reads/
  writes an in-memory seed array shaped exactly like the real Day-6 API
  contract.
- Every list/detail view needs all four states: loading (`skeletonRows`),
  success-with-data, success-empty (`.empty-state`), and failure
  (`.error-state` with Retry).
- One `openPanel(id)`/`closeAllPanels()` pair drives every drawer/modal;
  toasts are for one-off confirmations only; never use `alert()`/`confirm()`.

Full templates for all of this are in `references/design-system.md`
(carried over unchanged from the previous version).

## PR / consistency checklist (for Ayush's Day 2-4 review pass)

- [ ] Colors are `var(--token)`, never a hardcoded hex — **including** the new `--tier-*` and `--danger` tokens.
- [ ] Any ID/hash/timestamp uses the mono font class.
- [ ] Headlines/section titles use the heavier weight (700-800); body/table text stays at the original dense weight — don't let "bolder headlines" creep into making tables harder to scan.
- [ ] A risk score anywhere in the app uses `.risk-gauge`, not a plain progress bar or a hand-rolled percentage — consistency here is the main visual signature of this refresh.
- [ ] A genuinely new shared component is added to `references/design-system.md` and flagged to the team before merging.
- [ ] All four view-states (loading/success/empty/error) exist for any new async view.
