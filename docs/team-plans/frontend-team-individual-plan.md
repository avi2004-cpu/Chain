# ChainGuard Frontend Team — Individual 12-Day Breakdown

Team: Ayush (lead/monitor), Abdullah, Safeer, Nazima
Reference: this plan assumes the backend/Fabric team delivers an API
contract by Day 6 (see the master spec doc). Days 1-6 are structured so
frontend work never blocks on that.

---

## Ayush — Team Lead / Monitor

**Overall responsibility:** Ayush doesn't own a single page — his job is
to make sure Abdullah, Safeer, and Nazima's work stays consistent with
each other and lands correctly on top of whatever the backend team ships.

| Day | Task | Deliverable |
|---|---|---|
| 1 | Lead the full-team UI walkthrough. Assign page ownership (below). Set shared conventions: component naming, folder structure, Tailwind class patterns to reuse. | Ownership list + conventions doc (can be a short section added to the master spec) |
| 2 | Review each teammate's plan for their owned pages before they start building — catch conflicting assumptions early (e.g. two people both touching `WalletContext.jsx`). | Sign-off on each person's Day 3-4 plan |
| 3-4 | Float between teammates, unblock issues, review PRs/commits as they land. Keep a running list of shared components that need to change (e.g. `ClassificationBadge`, `RiskGauge`) so changes don't get made twice in conflicting ways. | Shared-component change log |
| 5 | Join Safeer on the Risk Decision screen polish — this is the highest-stakes screen, worth a second set of eyes. | Reviewed, approved Risk Decision UI |
| 6 | Own this day personally: get the backend team's API contract doc, read it fully, translate it into plain terms for the other three (endpoint names, what data shape each page needs), and kick off the mock API layer build. | Mock API layer spec shared with team |
| 7-8 | Coordinate integration order across the team (who wires up first, in what sequence) so two people aren't editing the same data-fetching file simultaneously. Sync directly with Avikrit/Jeswin on backend readiness day by day. | Daily integration status update |
| 9-10 | Run cross-browser/cross-device checks personally across all pages (not just your own), since you have visibility into the whole app. Log every bug found, assign to the right owner. | Bug list, triaged and assigned |
| 11-12 | Own the demo rehearsal: script the click-through order, time it, and run it live with the team at least three times (not two — with no recorded backup, more live reps is the only safety margin left). Coordinate with the backend team on what's shown when, and rehearse recovery moves for common live hiccups (e.g. what to say/do if a transaction takes longer than expected on stage). | Thoroughly rehearsed live demo, no recording fallback |

---

## Abdullah — Dashboard + Login

| Day | Task | Deliverable |
|---|---|---|
| 1-2 | Audit `Login.jsx` and `Dashboard.jsx` against the UI walkthrough notes. List every missing state: what does Dashboard look like with zero owned assets? What does Login look like if MetaMask isn't installed at all (not just rejected)? Swap any placeholder asset names for the real BEL-themed ones in `data/assets.js`. | Written list of gaps + updated demo data |
| 3-4 | Build out the missing states from your list: empty-state Dashboard, MetaMask-not-installed message on Login, role-specific Dashboard layouts (Admin sees different cards than Engineer). Add proper loading spinners for the wallet connection step. | Fully stated Login + Dashboard pages |
| 5 | Accessibility and responsive pass on your two pages: keyboard navigation through the login flow, mobile breakpoint check, color contrast on role badges. | Responsive, accessible Login + Dashboard |
| 6 | Read the backend API contract sections relevant to identity lookup and dashboard data (owned assets, pending requests). Build your piece of the mock API layer for these two endpoints. | Mock identity + dashboard-data functions |
| 7-8 | **You go first in the integration order** (lowest-risk page — identity lookup is simpler than risk-scoring). Replace your mock calls with real backend calls. Confirm role/DID display works correctly with real Fabric-issued identities, not just demo accounts. | Live-wired Login + Dashboard |
| 9-10 | Test your pages specifically with slow/failed network conditions (throttle in DevTools) — this is where real backend integration differs most from static demo data. Fix any broken loading/error states you find. | Network-resilient Login + Dashboard |
| 11-12 | Full bug bash on the whole app (not just your pages) alongside the team. Be ready to demo the Login flow live — you'll likely open the demo. | Ready to present opening flow |

---

## Safeer — Asset Request + Risk Decision

| Day | Task | Deliverable |
|---|---|---|
| 1-2 | Audit `AssetRequest.jsx` and `RiskDecision.jsx`. This is the most important screen pair in the whole demo — spend extra time here. List missing states: what happens if `computeRisk()` hasn't run yet? What if the user navigates to Risk Decision directly without going through Asset Request first (currently should redirect — verify it does)? | Written gap list, prioritized |
| 3-4 | Build out full state coverage: loading state while risk is computed, the three outcome states (Allow/Step-Up/Block) fully styled, the step-up signing flow (`handleSign`) with clear waiting/success/error states. | Fully stated Asset Request + Risk Decision |
| 5 | **Deep polish day**, with Ayush reviewing. Smooth score-reveal animation on `RiskGauge`, clear factor-by-factor breakdown on `FactorBar`, make colors/icons for Allow/Step-Up/Block instantly readable from a distance. This is what judges will screenshot. | Polished, demo-ready Risk Decision screen |
| 6 | Read the backend contract sections for the access-request and risk-logging endpoints. Build the mock layer for `requestAccess` and `logDecision` equivalents, matching real backend shapes. | Mock access-request + decision-log functions |
| 7-8 | Wire Asset Request to real backend first (simpler — just fetches asset data), then Risk Decision (depends on the risk engine's backend integration, so coordinate timing with Avikrit/Jeswin directly). | Live-wired Asset Request + Risk Decision |
| 9-10 | This page will show new real states you haven't seen in mock mode: **endorsement-pending** (waiting for Fabric multi-org approval on Restricted assets), possible timeout if the network is slow. Build clear UI for "waiting for approval" that doesn't look broken or frozen. | Endorsement-pending state handled gracefully |
| 11-12 | Bug bash + be ready to demo the core risk-scoring flow live — likely the centerpiece of your team's presentation. Rehearse narrating what's happening on screen while it happens. | Ready to present the risk-decision demo moment |

---

## Nazima — Audit Log + Admin Views

| Day | Task | Deliverable |
|---|---|---|
| 1-2 | Audit `AuditLog.jsx` and any Admin-specific dashboard views. List gaps: filtering/sorting options, empty state (no logs yet), and how multi-sig/endorsement approvals should be visually represented (this doesn't fully exist yet in the hackathon build — you're building it new). | Written gap list + rough design for endorsement view |
| 3-4 | Build out Audit Log filtering (by classification, by outcome, by date range) and a new Admin view showing pending multi-org approval requests with an "approve" action. | Functional Audit Log + Admin approval view |
| 5 | Polish visual hierarchy: make it easy to scan a long log for anomalies (color-code blocked/step-up entries), and make the pending-approvals view clearly show "1 of 2 orgs approved" progress. | Polished Audit Log + Admin approval view |
| 6 | Read the backend contract sections for audit log retrieval and multi-org approval status. Build the mock layer for `getAccessLogs` and approval-status endpoints. | Mock audit-log + approval-status functions |
| 7-8 | Wire Audit Log to real backend last in the integration order (it depends on other flows having generated real log entries first — coordinate with Abdullah and Safeer on sequencing). | Live-wired Audit Log |
| 9-10 | **This is the most important verification task on the team**: confirm that what's shown in the Audit Log actually matches what happened on-chain — pull a raw record via Fabric CLI yourself and compare it to what the UI displays. This is your proof-of-correctness moment for the whole system. | Verified on-chain-to-UI data integrity |
| 11-12 | Bug bash + be ready to demo the Audit Log as the "closing the loop" moment — showing judges that every access decision, however it resolved, is permanently and correctly recorded. | Ready to present the audit-trail demo moment |

---

## Cross-team coordination points (all four should know these)

- **Day 6 is the hinge point** — everyone's mock layer must match the same
  real API contract, or Days 7-8 repeat the compatibility chaos from the
  first hackathon build. Don't build your mock layer in isolation.
- **Integration order matters**: Login/identity (Abdullah) → Asset Request
  (Safeer) → Risk Decision (Safeer) → Audit Log (Nazima). Later pages
  depend on earlier ones producing real data to display.
- **Shared components** (`ClassificationBadge`, `RiskGauge`, `FactorBar`,
  `Navbar`) are used across multiple people's pages — any change to these
  should be flagged to Ayush before merging, so it doesn't silently break
  someone else's page.
