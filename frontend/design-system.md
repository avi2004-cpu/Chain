# DecentraVault Design System — Full Reference (OFFENSAI-inspired dark refresh)

Copy-paste source for everything summarized in `../SKILL.md`. Sections 1-9
and 16-17 are the original component set (recolored). Sections 10-15 are
new, added after reviewing OFFENSAI (offensai.com) as a visual reference.
Section 3B is new on top of that — iOS-style frosted glass for chrome/
overlays (sidebar, drawer, modal, toast), layered onto sections 3 and 16.

## 1. Fonts (unchanged)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

## 2. Full CSS variable block — new dark palette

```css
:root {
  --bg: #0A0D12;
  --surface: #12161D;
  --surface-2: #171C25;
  --surface-3: #1E242F;
  --border: #262D3A;
  --text: #F2F4F7;
  --text-dim: #9AA4B2;
  --text-faint: #6B7684;

  --accent: #2F6FED;
  --accent-soft: #16233D;
  --accent-strong: #5B93FF;

  --danger: #E5484D;
  --danger-soft: #2E1418;

  --allow: #22C55E;
  --allow-soft: #10241A;
  --stepup: #F5A524;
  --stepup-soft: #2E2311;
  --block: #EF4444;
  --block-soft: #2E1517;
  --endorsed: #2F6FED;
  --endorsed-soft: #16233D;

  /* 5-tier severity scale — new, for graduated scores (risk gauge, factor table) */
  --tier-critical: #EF4444;
  --tier-high: #F97316;
  --tier-medium: #F5C518;
  --tier-low: #22C55E;
  --tier-info: #64748B;

  --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace;
  --radius-sm: 4px;
  --radius: 6px;
  --shadow-drawer: -8px 0 32px rgba(0, 0, 0, 0.55);
  --shadow-modal: 0 16px 40px rgba(0, 0, 0, 0.6);
  --glow-blue: 0 0 0 1px var(--accent), 0 0 24px rgba(47, 111, 237, 0.35);
  --glow-red: 0 0 0 1px var(--danger), 0 0 20px rgba(229, 72, 77, 0.35);

  /* iOS-style frosted glass — for chrome/overlays only, see section 3B */
  --glass-tint: rgba(255, 255, 255, 0.055);
  --glass-tint-strong: rgba(255, 255, 255, 0.09);
  --glass-border: rgba(255, 255, 255, 0.14);
  --glass-highlight: rgba(255, 255, 255, 0.28);
  --glass-blur: 22px;
  --radius-glass: 20px;
}

* { box-sizing: border-box; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13.5px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* Colored wash behind the whole app so glass surfaces have something to
   refract — without this, backdrop-filter on a flat #0A0D12 just looks
   like a darker gray, not glass. Keep it subtle and static (no animation)
   so it reads as ambient lighting, not decoration. */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(640px circle at 12% 18%, rgba(47, 111, 237, 0.22), transparent 60%),
    radial-gradient(560px circle at 88% 78%, rgba(229, 72, 77, 0.16), transparent 60%),
    var(--bg);
}
```

This app is dark-only now (matching OFFENSAI, which doesn't offer a light
mode either) — there's no light-theme override block to maintain. If a
light mode ever comes back, reintroduce the old token values under
`@media (prefers-color-scheme: light)` rather than making dark the
override.

## 3B. Glass / frosted chrome (iOS-style) — NEW

Apple's own glass material (Control Center, sheets, tab bars) is used for
**navigation and floating chrome that sits above content — never for the
content itself.** Copy that rule here: the sidebar, the sticky toolbar,
drawers, modals, dropdown menus, and the toast get glass. The data — every
`.panel`, `.metric-card`, `.log-row`, `.factor-table` — stays opaque,
because backdrop-blur under dense text or a data table makes it harder to
read, not more premium-looking.

Two utility classes cover every case:

```css
/* Edge-attached chrome that spans a full side of the viewport — sidebar,
   a sticky top toolbar. Straight edges, no elevation shadow (it's part
   of the frame, not floating above it). */
.glass-bar {
  background: var(--glass-tint);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  border-color: var(--glass-border);
}

/* Floating chrome — modal, dropdown, toast. Full rounded corners
   (squircle-ish radius), a soft elevation shadow, and a thin specular
   highlight along the top edge, which is what actually reads as "glass"
   rather than "semi-transparent gray box." */
.glass-floating {
  position: relative;
  background: var(--glass-tint-strong);
  backdrop-filter: blur(calc(var(--glass-blur) + 6px)) saturate(180%);
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) + 6px)) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-glass);
  box-shadow: inset 0 1px 0 var(--glass-highlight), 0 20px 50px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
.glass-floating::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.14), transparent 42%);
  pointer-events: none;
}

/* The drawer is edge-attached on the right but still floats above
   content, so it's a hybrid: glass-floating's blur/tint/highlight, but
   only the exposed (left) corners are rounded — the right edge meets
   the viewport edge and should stay square. */
.drawer.glass-floating { border-radius: var(--radius-glass) 0 0 var(--radius-glass); }

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-bar, .glass-floating { background: var(--surface-2); }
}
```

Fallback matters here: `backdrop-filter` is well-supported in current
Chrome/Edge/Safari, but the `@supports` block above means a stray older
browser on demo day gets a plain solid panel instead of a broken
see-through one — never ship the blur without it.

## 3. Shell (sidebar + main)

```css
.shell { display: grid; grid-template-columns: 232px 1fr; min-height: 100vh; }
@media (max-width: 860px) { .shell { grid-template-columns: 1fr; } }

.side { background: var(--surface); border-right: 1px solid var(--border); padding: 18px 14px 14px; display: flex; flex-direction: column; }
.nav-group { margin-bottom: 14px; }
.nav-group-label { font-size: 10px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-faint); padding: 0 8px 6px; }
.nav-item { display: flex; align-items: center; gap: 9px; padding: 7px 8px; border-radius: var(--radius-sm); color: var(--text-dim); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; }
.nav-item:hover:not(.disabled) { background: var(--surface-2); }
.nav-item.active { background: var(--accent-soft); color: var(--accent-strong); border-color: var(--accent); }
.nav-item.disabled { cursor: default; color: var(--text-faint); opacity: 0.6; }
.soon-tag { margin-left: auto; font-size: 9px; font-weight: 600; text-transform: uppercase; color: var(--text-faint); background: var(--surface-2); border: 1px solid var(--border); padding: 1px 5px; border-radius: 3px; }

.main { padding: 20px 26px 60px; max-width: 1180px; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 18px; flex-wrap: wrap; }
.page-title { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 3px; }
.page-desc { color: var(--text-dim); font-size: 12.5px; margin: 0; max-width: 54ch; }
.env-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--text-dim); background: var(--surface-2); border: 1px solid var(--border); padding: 3px 9px; border-radius: 20px; }
```

Markup: `<aside class="side glass-bar">…</aside>` — the sidebar is chrome,
so it gets the glass treatment from section 3B stacked on top of `.side`'s
layout rules. If the toolbar (section 5) is ever made `position: sticky`
so it stays pinned while a long list scrolls under it, give it
`glass-bar` too for the same reason; leave it plain if it just sits
inline at the top of a page.

## 4. Metrics row

```css
.metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
@media (max-width: 640px) { .metrics-row { grid-template-columns: repeat(2, 1fr); } }
.metric-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 11px 13px; }
.metric-label { font-size: 10.5px; font-weight: 600; text-transform: uppercase; color: var(--text-faint); display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.metric-dot { width: 6px; height: 6px; border-radius: 50%; }
.metric-value { font-size: 21px; font-weight: 700; font-family: var(--font-mono); letter-spacing: -0.02em; }
```

## 5. Toolbar / filters

```css
.toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-end; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: var(--text-faint); }
.field select, .field input { font-family: var(--font-ui); font-size: 12.5px; color: var(--text); background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 8px; }
.field select:focus, .field input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.search-field { flex: 1 1 180px; position: relative; }
.search-field input { width: 100%; padding-left: 26px; }
.clear-btn { font-size: 12px; font-weight: 500; color: var(--text-dim); background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 10px; cursor: pointer; }
```

## 6. Panel / row table

```css
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.log-row { display: grid; grid-template-columns: 122px 108px 96px 108px 92px 1fr; gap: 10px; align-items: center; padding: 9px 14px; border-bottom: 1px solid var(--border); border-left: 2px solid transparent; font-size: 12.5px; cursor: pointer; }
.log-row:hover:not(.head) { background: var(--surface-2); }
.log-row.outcome-Allow { border-left-color: var(--allow); }
.log-row.outcome-Step-Up { border-left-color: var(--stepup); }
.log-row.outcome-Block { border-left-color: var(--block); }
.log-row.outcome-Endorsed { border-left-color: var(--endorsed); }
.log-row.head { font-size: 10px; text-transform: uppercase; color: var(--text-faint); background: var(--surface-2); font-weight: 600; cursor: default; }
@media (max-width: 720px) {
  .log-row.head { display: none; }
  .log-row { grid-template-columns: 1fr; gap: 5px; padding: 12px 14px; }
}
.mono { font-family: var(--font-mono); color: var(--text-dim); font-size: 11.5px; }
```

## 7. Badges & tags

```css
.badge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 3px; font-size: 10.5px; font-weight: 600; text-transform: uppercase; width: fit-content; }
.badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; }
.badge.Allow { background: var(--allow-soft); color: var(--allow); }
.badge.Allow::before { background: var(--allow); }
.badge.Step-Up { background: var(--stepup-soft); color: var(--stepup); }
.badge.Step-Up::before { background: var(--stepup); }
.badge.Block { background: var(--block-soft); color: var(--block); }
.badge.Block::before { background: var(--block); }
.badge.Endorsed { background: var(--endorsed-soft); color: var(--endorsed); }
.badge.Endorsed::before { background: var(--endorsed); }

.class-tag { font-size: 10.5px; color: var(--text-dim); border: 1px solid var(--border); padding: 1px 6px; border-radius: var(--radius-sm); width: fit-content; }

/* 5-tier severity badge — new, uses --tier-* */
.tier-badge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 3px; font-size: 10.5px; font-weight: 600; }
.tier-badge.critical { background: color-mix(in srgb, var(--tier-critical) 16%, transparent); color: var(--tier-critical); }
.tier-badge.high { background: color-mix(in srgb, var(--tier-high) 16%, transparent); color: var(--tier-high); }
.tier-badge.medium { background: color-mix(in srgb, var(--tier-medium) 16%, transparent); color: var(--tier-medium); }
.tier-badge.low { background: color-mix(in srgb, var(--tier-low) 16%, transparent); color: var(--tier-low); }
.tier-badge.info { background: color-mix(in srgb, var(--tier-info) 16%, transparent); color: var(--tier-info); }
```

```html
<span class="badge Allow">Allow</span>
<span class="class-tag">Restricted</span>
<span class="tier-badge high">High</span>
```

## 8. Empty / skeleton / error states

```css
.empty-state { padding: 44px 20px; text-align: center; color: var(--text-dim); }
.empty-state .empty-title { color: var(--text); font-weight: 700; font-size: 13.5px; margin-bottom: 4px; }
.empty-state button { margin-top: 14px; font-size: 12px; font-weight: 600; color: var(--accent-strong); background: var(--accent-soft); border: none; padding: 7px 13px; border-radius: var(--radius-sm); cursor: pointer; }

.skeleton-row { padding: 11px 14px; border-bottom: 1px solid var(--border); }
.skeleton-bar { height: 10px; border-radius: 2px; background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.error-state .error-title { font-weight: 700; font-size: 13.5px; margin-bottom: 4px; color: var(--text); }
.error-state button { font-size: 12px; font-weight: 600; color: #fff; background: var(--block); border: none; padding: 7px 15px; border-radius: var(--radius-sm); cursor: pointer; }
```

```js
function skeletonRows(n) {
  let html = "";
  for (let i = 0; i < n; i++) {
    html += `<div class="skeleton-row"><div class="skeleton-bar" style="width:${58 + Math.random() * 32}%"></div></div>`;
  }
  return html;
}
```

## 9. Endorsement / progress

```css
.org-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface-2); }
.org-row.approved { background: var(--allow-soft); border-color: transparent; }
.org-approve-btn { font-size: 11px; font-weight: 600; color: var(--accent-strong); background: none; border: 1px solid var(--accent); padding: 3px 9px; border-radius: var(--radius-sm); cursor: pointer; }

.progress-track { height: 5px; background: var(--surface-3); border-radius: 3px; overflow: hidden; margin-top: 4px; }
.progress-fill { height: 100%; background: var(--stepup); transition: width 0.3s ease; }
.progress-fill.done { background: var(--allow); }
.progress-label { font-size: 11px; color: var(--text-faint); margin-top: 6px; }
```

```js
function orgRowsHtml(req) {
  return req.requiredOrgs.map((org) => {
    const approved = req.approvedOrgs.includes(org);
    return `<div class="org-row ${approved ? "approved" : ""}">
      <div class="org-left">${org}</div>
      ${approved
        ? '<span class="org-status-text">Approved</span>'
        : `<button class="org-approve-btn" data-req="${req.id}" data-org="${org}">Approve</button>`}
    </div>`;
  }).join("");
}
```

---

## 10. Risk score ring gauge + factor table — NEW (this is `RiskGauge` / `FactorBar`)

Modeled directly on OFFENSAI's "AVERAGE CSIR SCORE" ring + weighted
"SCORE CALCULATION" table. Use `--tier-*` for the arc color based on
where the score falls (e.g. ≥8 critical, ≥6 high, ≥4 medium, ≥2 low, else info).

```html
<div class="risk-gauge">
  <svg viewBox="0 0 120 120" class="risk-gauge-svg">
    <circle class="risk-gauge-track" cx="60" cy="60" r="52" />
    <circle class="risk-gauge-arc" cx="60" cy="60" r="52"
            style="--pct: 74; stroke: var(--tier-high)" />
  </svg>
  <div class="risk-gauge-center">
    <div class="risk-gauge-score">7.4</div>
    <div class="risk-gauge-tier" style="color: var(--tier-high)">High</div>
  </div>
</div>

<table class="factor-table">
  <thead><tr><th>Factor</th><th>Weight</th><th>Score</th><th>Weighted</th></tr></thead>
  <tbody>
    <tr><td>Device Trust</td><td>25%</td><td>6/10</td><td class="mono">1.50</td></tr>
    <tr><td>Location Anomaly</td><td>20%</td><td>8/10</td><td class="mono">1.60</td></tr>
    <tr><td>Time-of-Access</td><td>15%</td><td>3/10</td><td class="mono">0.45</td></tr>
    <tr><td>Asset Classification</td><td>25%</td><td>9/10</td><td class="mono">2.25</td></tr>
    <tr><td>Session Behavior</td><td>15%</td><td>7/10</td><td class="mono">1.05</td></tr>
  </tbody>
</table>
```

```css
.risk-gauge { position: relative; width: 132px; height: 132px; }
.risk-gauge-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.risk-gauge-track { fill: none; stroke: var(--surface-3); stroke-width: 10; }
.risk-gauge-arc {
  fill: none; stroke-width: 10; stroke-linecap: round;
  stroke-dasharray: 326.7; /* 2 * pi * 52 */
  stroke-dashoffset: calc(326.7 - (326.7 * var(--pct)) / 100);
  transition: stroke-dashoffset 0.4s ease;
}
.risk-gauge-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.risk-gauge-score { font-family: var(--font-mono); font-size: 26px; font-weight: 700; color: var(--text); }
.risk-gauge-tier { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 2px; }

.factor-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 14px; }
.factor-table th { text-align: left; font-size: 10px; text-transform: uppercase; color: var(--text-faint); font-weight: 600; padding: 6px 8px; border-bottom: 1px solid var(--border); }
.factor-table td { padding: 7px 8px; border-bottom: 1px solid var(--border); color: var(--text-dim); }
.factor-table td:first-child { color: var(--text); }
.factor-table td.mono { font-family: var(--font-mono); color: var(--text); }
```

Optional companion legend (for a breakdown-by-count view, e.g. Audit Log summary):

```html
<div class="tier-legend">
  <div class="tier-legend-row"><span class="tier-dot" style="background:var(--tier-critical)"></span>Critical<span class="mono" style="margin-left:auto">3 (9%)</span></div>
  <div class="tier-legend-row"><span class="tier-dot" style="background:var(--tier-high)"></span>High<span class="mono" style="margin-left:auto">8 (24%)</span></div>
</div>
```
```css
.tier-legend-row { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-dim); padding: 3px 0; }
.tier-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
```

## 11. Step process — NEW

For onboarding, or narrating the request → risk → endorsement → log flow.

```html
<div class="step-process">
  <div class="step">
    <div class="step-row"><div class="step-num">1</div><div class="step-line"></div></div>
    <div class="step-title">Request access</div>
    <div class="step-desc">Requester submits an asset access request with no prior trust assumed.</div>
  </div>
  <!-- repeat, omit .step-line on the last item -->
</div>
```
```css
.step-process { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
@media (max-width: 860px) { .step-process { grid-template-columns: 1fr; } }
.step-row { display: flex; align-items: center; }
.step-num { width: 36px; height: 36px; border-radius: 50%; background: var(--danger); color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.step-line { flex: 1; height: 2px; background: var(--danger); opacity: 0.4; margin: 0 4px; }
.step:last-child .step-line { display: none; }
.step-title { font-weight: 700; font-size: 14px; margin: 10px 0 4px; }
.step-desc { font-size: 12.5px; color: var(--text-dim); }
```

## 12. Glow card — NEW ("why/trust" pattern)

```html
<div class="glow-card emphasis">
  <div class="glow-icon" style="--icon-color: var(--accent)">&#128737;</div>
  <div class="glow-title">Human-initiated by design</div>
  <div class="glow-desc">Endorsement actions only run on explicit org approval — never automated.</div>
</div>
```
```css
.glow-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
.glow-card.emphasis { border-color: var(--accent); box-shadow: var(--glow-blue); }
.glow-icon {
  width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 22px; margin-bottom: 14px;
  background: color-mix(in srgb, var(--icon-color) 18%, var(--surface-2));
  box-shadow: 0 0 18px color-mix(in srgb, var(--icon-color) 45%, transparent);
}
.glow-title { font-weight: 700; font-size: 15px; margin-bottom: 6px; }
.glow-desc { font-size: 12.5px; color: var(--text-dim); }
```
`color-mix()` needs a recent evergreen browser (fine for a hackathon judged
on a laptop with current Chrome/Edge) — if you need to support anything
older, precompute a couple of tint variables per icon color instead.

## 13. Node / circuit diagram — NEW

For a future "Asset Inventory," "Organizations," or "Endorsements" overview
— icon-badge nodes with an alert-count dot, connected by thin lines.

```html
<div class="node-diagram">
  <div class="node" style="top: 30px; left: 40px;">
    <div class="node-badge"><span class="node-icon">&#127760;</span><span class="node-alert">3</span></div>
    <div class="node-label">External Identity</div>
  </div>
  <div class="node" style="top: 120px; left: 220px;">
    <div class="node-badge"><span class="node-icon">&#128274;</span></div>
    <div class="node-label">Access Control</div>
  </div>
  <!-- connect nodes with an absolutely-positioned SVG <line> layer beneath them,
       stroke: var(--border) for normal links, var(--danger) at low opacity
       for links touching a node that has an alert count -->
</div>
```
```css
.node-diagram { position: relative; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 30px; min-height: 320px; overflow: hidden; }
.node { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.node-badge { position: relative; width: 44px; height: 44px; border-radius: 10px; background: var(--surface-2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 18px; }
.node-badge:has(.node-alert) { border-color: var(--danger); box-shadow: var(--glow-red); }
.node-alert { position: absolute; top: -6px; right: -6px; background: var(--danger); color: #fff; font-size: 9px; font-weight: 700; min-width: 15px; height: 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.node-label { font-size: 10.5px; color: var(--text-dim); text-align: center; max-width: 84px; }
```

## 14. Pill tabs — NEW

```html
<div class="pill-tabs">
  <button class="pill-tab active">Overview</button>
  <button class="pill-tab">Validation Results</button>
  <button class="pill-tab">Remediation</button>
</div>
```
```css
.pill-tabs { display: flex; gap: 4px; background: var(--surface-2); border-radius: 999px; padding: 4px; width: fit-content; }
.pill-tab { border: none; background: none; color: var(--text-dim); font-size: 12.5px; font-weight: 600; padding: 8px 16px; border-radius: 999px; cursor: pointer; }
.pill-tab.active { background: var(--accent); color: #fff; }
```

## 15. Screen frame — NEW (browser-chrome wrapper for embedded previews)

```html
<div class="screen-frame">
  <div class="screen-frame-bar"><span></span><span></span><span></span></div>
  <div class="screen-frame-body">
    <!-- embedded preview content, e.g. a mini Risk Decision view inside an Admin drawer -->
  </div>
</div>
```
```css
.screen-frame { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.screen-frame-bar { display: flex; gap: 6px; padding: 10px 12px; border-bottom: 1px solid var(--border); }
.screen-frame-bar span { width: 9px; height: 9px; border-radius: 50%; background: var(--surface-3); }
.screen-frame-body { padding: 18px; }
```

---

## 16. Drawer, modal, toast

```css
.overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); opacity: 0; pointer-events: none; transition: opacity 0.18s ease; z-index: 40; }
.overlay.show { opacity: 1; pointer-events: auto; }

/* .drawer, .modal, .toast now rely on .glass-floating (section 3B) for
   background/blur/border/shadow — these rules only cover position,
   size, and the show/hide transition. Markup: class="drawer glass-floating" */
.drawer { position: fixed; top: 0; right: 0; height: 100%; width: 380px; max-width: 92vw; transform: translateX(100%); transition: transform 0.22s ease; z-index: 41; display: flex; flex-direction: column; }
.drawer.show { transform: translateX(0); }
.detail-row { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--border); }
.detail-v.mono { font-family: var(--font-mono); font-size: 12px; }

.modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -48%); width: 380px; max-width: 90vw; z-index: 41; opacity: 0; pointer-events: none; transition: opacity 0.18s ease, transform 0.18s ease; }
.modal.show { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%); }

.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(8px); color: var(--text); font-size: 12.5px; font-weight: 500; padding: 9px 16px; border-radius: 999px; opacity: 0; pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; z-index: 50; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
```

```html
<div id="event-drawer" class="drawer glass-floating">…</div>
<div id="dev-modal" class="modal glass-floating">…</div>
<div id="toast" class="toast glass-floating">…</div>
```

```js
let openPanelId = null;
function openPanel(id) {
  closeAllPanels();
  $(id).classList.add("show");
  overlay.classList.add("show");
  openPanelId = id;
}
function closeAllPanels() {
  ["event-drawer", "req-drawer", "dev-modal"].forEach((id) => $(id).classList.remove("show"));
  overlay.classList.remove("show");
  openPanelId = null;
}
overlay.addEventListener("click", closeAllPanels);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAllPanels(); });

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1700);
}
```

## 17. Full mock-API layer template (Day 6 task) — unchanged

```js
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function getAccessLogs(filters) {
  await delay(280);
  let rows = [...seedLogs];
  if (filters.classification) rows = rows.filter((r) => r.classification === filters.classification);
  if (filters.outcome) rows = rows.filter((r) => r.outcome === filters.outcome);
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter((r) =>
      r.requester.toLowerCase().includes(q) ||
      r.assetId.toLowerCase().includes(q) ||
      r.txHash.toLowerCase().includes(q));
  }
  rows.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return rows;
}

async function approveOrg(requestId, org) {
  await delay(240);
  const req = seedApprovals.find((a) => a.id === requestId);
  if (!req) return;
  if (!req.approvedOrgs.includes(org)) req.approvedOrgs.push(org);
  if (req.approvedOrgs.length === req.requiredOrgs.length) {
    seedLogs.unshift({
      id: "L-" + (1043 + seedLogs.length),
      timestamp: new Date().toISOString().slice(0, 19),
      requester: req.requester,
      assetId: req.assetId,
      classification: req.classification,
      outcome: "Endorsed",
      txHash: "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10),
    });
  }
  return req;
}
```

Use a `#sim-slow` / `#sim-fail` toggle (Developer Mode modal) to trigger
slow-network and error states on demand for Days 9-10 testing.
