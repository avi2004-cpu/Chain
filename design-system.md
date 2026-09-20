# DecentraVault Design System — Full Reference

Copy-paste source for everything summarized in `../SKILL.md`. Extracted
directly from `audit-log-prototype-1.html`. If you change any of this,
update it here too and flag the change to the whole team (see the PR
checklist in SKILL.md).

## 1. Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

## 2. Full CSS variable block (light + dark)

```css
:root {
  --bg: #F4F5F6;
  --surface: #FFFFFF;
  --surface-2: #EDEFF0;
  --surface-3: #E4E7E8;
  --border: #DADFE1;
  --border-strong: #C4CBCE;
  --text: #16191C;
  --text-dim: #5B6469;
  --text-faint: #8A9297;
  --accent: #0E8C82;
  --accent-soft: #E1F2F0;
  --accent-strong: #0B6E66;
  --allow: #16803D;
  --allow-soft: #E7F5EC;
  --stepup: #A15C00;
  --stepup-soft: #FBEEDA;
  --block: #C0272D;
  --block-soft: #FBE6E6;
  --endorsed: #0E8C82;
  --endorsed-soft: #E1F2F0;
  --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace;
  --radius-sm: 3px;
  --radius: 5px;
  --shadow-drawer: -8px 0 24px rgba(15, 20, 23, 0.10);
  --shadow-modal: 0 12px 32px rgba(15, 20, 23, 0.16);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #101315;
    --surface: #16191C;
    --surface-2: #1D2023;
    --surface-3: #24282B;
    --border: #2B2F32;
    --border-strong: #383D40;
    --text: #E7E9EA;
    --text-dim: #9AA2A7;
    --text-faint: #6B7378;
    --accent: #3FC4B8;
    --accent-soft: #16302E;
    --accent-strong: #5CD3C8;
    --allow: #3FB86A;
    --allow-soft: #16281D;
    --stepup: #E2A33B;
    --stepup-soft: #2E2313;
    --block: #E5595E;
    --block-soft: #331B1C;
    --endorsed: #3FC4B8;
    --endorsed-soft: #16302E;
    --shadow-drawer: -8px 0 28px rgba(0, 0, 0, 0.45);
    --shadow-modal: 0 16px 40px rgba(0, 0, 0, 0.5);
  }
}
:root[data-theme="dark"] {
  /* identical values to the block above — force-dark override */
  --bg: #101315; --surface: #16191C; --surface-2: #1D2023; --surface-3: #24282B;
  --border: #2B2F32; --border-strong: #383D40;
  --text: #E7E9EA; --text-dim: #9AA2A7; --text-faint: #6B7378;
  --accent: #3FC4B8; --accent-soft: #16302E; --accent-strong: #5CD3C8;
  --allow: #3FB86A; --allow-soft: #16281D;
  --stepup: #E2A33B; --stepup-soft: #2E2313;
  --block: #E5595E; --block-soft: #331B1C;
  --endorsed: #3FC4B8; --endorsed-soft: #16302E;
  --shadow-drawer: -8px 0 28px rgba(0, 0, 0, 0.45);
  --shadow-modal: 0 16px 40px rgba(0, 0, 0, 0.5);
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
```

## 3. Shell (sidebar + main)

```css
.shell { display: grid; grid-template-columns: 232px 1fr; min-height: 100vh; }
@media (max-width: 860px) { .shell { grid-template-columns: 1fr; } }

.side { background: var(--surface); border-right: 1px solid var(--border); padding: 18px 14px 14px; display: flex; flex-direction: column; }
.nav-group { margin-bottom: 14px; }
.nav-group-label { font-size: 10px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-faint); padding: 0 8px 6px; }
.nav-item { display: flex; align-items: center; gap: 9px; padding: 7px 8px; border-radius: var(--radius-sm); color: var(--text-dim); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; }
.nav-item:hover:not(.disabled) { background: var(--surface-2); }
.nav-item.active { background: var(--accent-soft); color: var(--accent-strong); }
.nav-item.disabled { cursor: default; color: var(--text-faint); opacity: 0.65; }
.soon-tag { margin-left: auto; font-size: 9px; font-weight: 600; text-transform: uppercase; color: var(--text-faint); background: var(--surface-2); border: 1px solid var(--border); padding: 1px 5px; border-radius: 3px; }

.main { padding: 20px 26px 60px; max-width: 1180px; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 18px; flex-wrap: wrap; }
.page-title { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; margin: 0 0 3px; }
.page-desc { color: var(--text-dim); font-size: 12.5px; margin: 0; max-width: 54ch; }
.env-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--text-dim); background: var(--surface-2); border: 1px solid var(--border); padding: 3px 9px; border-radius: 20px; }
```

## 4. Metrics row

```css
.metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
@media (max-width: 640px) { .metrics-row { grid-template-columns: repeat(2, 1fr); } }
.metric-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 11px 13px; }
.metric-label { font-size: 10.5px; font-weight: 600; text-transform: uppercase; color: var(--text-faint); display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.metric-dot { width: 6px; height: 6px; border-radius: 50%; }
.metric-value { font-size: 21px; font-weight: 600; font-family: var(--font-mono); letter-spacing: -0.02em; }
```

## 5. Toolbar / filters

```css
.toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-end; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: var(--text-faint); }
.field select, .field input { font-family: var(--font-ui); font-size: 12.5px; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 8px; }
.field select:focus, .field input:focus { outline: none; border-color: var(--accent); }
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

## 7. Badges & tags (the ONLY status-color pattern)

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
```

```html
<span class="badge Allow">Allow</span>
<span class="badge Step-Up">Step-Up</span>
<span class="badge Block">Block</span>
<span class="class-tag">Restricted</span>
```

## 8. Empty / skeleton / error states

```css
.empty-state { padding: 44px 20px; text-align: center; color: var(--text-dim); }
.empty-state .empty-title { color: var(--text); font-weight: 600; font-size: 13.5px; margin-bottom: 4px; }
.empty-state button { margin-top: 14px; font-size: 12px; font-weight: 600; color: var(--accent-strong); background: var(--accent-soft); border: none; padding: 7px 13px; border-radius: var(--radius-sm); cursor: pointer; }

.skeleton-row { padding: 11px 14px; border-bottom: 1px solid var(--border); }
.skeleton-bar { height: 10px; border-radius: 2px; background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.error-state .error-title { font-weight: 600; font-size: 13.5px; margin-bottom: 4px; color: var(--text); }
.error-state button { font-size: 12px; font-weight: 600; color: var(--surface); background: var(--block); border: none; padding: 7px 15px; border-radius: var(--radius-sm); cursor: pointer; }
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

## 9. Endorsement / progress (for Admin approvals and Safeer's step-up flow)

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
// pct = Math.round((req.approvedOrgs.length / req.requiredOrgs.length) * 100);
// <div class="progress-fill ${pct === 100 ? 'done' : ''}" style="width:${pct}%"></div>
```

## 10. Drawer, modal, toast

```css
.overlay { position: fixed; inset: 0; background: rgba(10, 13, 15, 0.42); opacity: 0; pointer-events: none; transition: opacity 0.18s ease; z-index: 40; }
.overlay.show { opacity: 1; pointer-events: auto; }

.drawer { position: fixed; top: 0; right: 0; height: 100%; width: 380px; max-width: 92vw; background: var(--surface); border-left: 1px solid var(--border); box-shadow: var(--shadow-drawer); transform: translateX(100%); transition: transform 0.22s ease; z-index: 41; display: flex; flex-direction: column; }
.drawer.show { transform: translateX(0); }
.detail-row { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--border); }
.detail-v.mono { font-family: var(--font-mono); font-size: 12px; }

.modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -48%); width: 380px; max-width: 90vw; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-modal); z-index: 41; opacity: 0; pointer-events: none; transition: opacity 0.18s ease, transform 0.18s ease; }
.modal.show { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%); }

.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(8px); background: var(--text); color: var(--bg); font-size: 12.5px; font-weight: 500; padding: 9px 16px; border-radius: var(--radius-sm); opacity: 0; pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; z-index: 50; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
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

## 11. Full mock-API layer template (Day 6 task)

Every page's Day-6 mock layer should follow this exact shape so swapping
in the real Fabric-backed REST endpoints on Days 7-8 is a pure
find-and-replace of the function body, never the call sites:

```js
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// READ — filter an in-memory seed array the same way the real endpoint
// will filter server-side, so UI filtering logic never has to change.
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

// WRITE — mutate the seed array and return the updated record, exactly
// like a real POST/PATCH endpoint would return the updated resource.
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

Use the `#sim-slow` / `#sim-fail` toggle pattern (see the Developer Mode
modal in the prototype) to let yourself manually trigger the slow-network
and error states from Days 9-10's testing tasks without needing the real
backend to misbehave on demand.
