# ChainGuard Backend Team — Individual 12-Day Breakdown

Team: Avikrit (self), Jeswin, Ayush (partial — shifts to frontend
monitoring from Day 5 onward, see frontend plan)
Reference: Day 6 is the hinge point — the API contract must be finished
and shared with the frontend team on this day, no later. Everything on
this team's schedule is sequenced to protect that deadline.

No fallback: the team is committing fully to Hyperledger Fabric, built
from scratch. There is no parallel Ethereum track. This raises the stakes
on the schedule below — treat Day 6 (API contract) and Days 9-10
(integration testing) as non-negotiable checkpoints, since there's no
second system to lean on if something slips.

---

## Avikrit — Chaincode Lead + API Contract Owner

| Day | Task | Deliverable |
|---|---|---|
| 1 | Set up the Fabric test-network locally from `fabric-samples` (release-2.5 branch) alongside Jeswin — do this together the first time so you both understand the same setup, then split from Day 2. Use the freed-up time (no Ethereum code to maintain) to also read through the Fabric chaincode lifecycle docs (install/approve/commit) end to end, since you'll run this for real on Day 5. | Fabric test-network running locally, confirmed with Jeswin, chaincode lifecycle understood |
| 2 | Set up your Go chaincode development environment (Go 1.21.x, `fabric-chaincode-go` v2.3.0+). Study the existing Solidity `IdentityRegistry.sol` and `AssetRegistry.sol` logic closely — you're porting the same rules, not redesigning them. | Go dev environment ready, port plan written |
| 3 | Write the **identity chaincode** in Go: register identity (address/DID/role), get role, get DID, is-registered check — same logic as `IdentityRegistry.sol`, adapted to Fabric's key-value ledger model (use composite keys, e.g. `identity~<id>`). | `identity` chaincode, unit-tested locally via Fabric CLI |
| 4 | Write the **asset chaincode** in Go: mint asset (name, classification, owner, metadata hash), get asset, transfer ownership — ported from `AssetRegistry.sol`. Remember: Restricted-classification minting will be gated by the endorsement policy (Day 6, with Jeswin), not custom code this time. | `asset` chaincode, unit-tested locally |
| 5 | Deploy both chaincodes to the local test-network channel. Run through the full CLI-based flow once (register identity → mint asset → query) to confirm they work together correctly before backend code touches them. | Both chaincodes deployed and verified end-to-end via CLI |
| 6 | **Own this day fully.** Write the API contract doc: every REST endpoint the backend will expose (e.g. `POST /identity/register`, `POST /assets/mint`, `GET /assets/:id`), with exact request/response JSON shapes. Share it with Ayush and the frontend team the same day — this cannot slip. | API contract doc delivered to frontend team |
| 7 | Start the Node.js backend project structure: install `@hyperledger/fabric-gateway`, set up the gateway connection (identity/wallet loading, channel/contract references) for the identity and asset chaincodes specifically. | Gateway connection working for identity + asset chaincode |
| 8 | Build the REST routes matching your Day 6 contract for identity and asset endpoints. Test each route with Postman/curl before telling frontend it's ready. | Working identity + asset REST endpoints |
| 9 | Support frontend's integration questions as they wire up Login/Dashboard (Abdullah) and Asset Request (Safeer) against your endpoints. Fix any contract mismatches immediately — these should be rare if Day 6 was done properly. | Identity + asset endpoints confirmed working from frontend's side |
| 10 | Help Jeswin finish wiring the risk-engine-to-access-control endpoint if needed. Otherwise, go deep on chaincode-level input validation hardening (reject malformed IDs, out-of-range classification values, duplicate registration attempts) — with no fallback system, this hardening matters more than it would have otherwise. | Validated, hardened chaincode inputs |
| 11 | Run a static analysis pass on the Go chaincode (`staticcheck` or similar). Write your section of `docs/security-review.md` covering what you checked and what's out of scope. | Security review notes for identity + asset chaincode |
| 12 | Full-team rehearsal support — be ready to explain/demo the chaincode and backend architecture live if judges ask to see it (terminal walkthrough as backup to the UI demo). | Ready to present backend architecture |

---

## Jeswin — Fabric Network + Access-Control/Endorsement Lead

| Day | Task | Deliverable |
|---|---|---|
| 1 | Set up the Fabric test-network with Avikrit (shared Day 1 task, see above). Afterward, study the network's organization structure (peers, orgs, channels) in the sample config — you'll be modifying this for the endorsement policy on Day 6. | Fabric test-network running, org structure understood |
| 2 | Define the org structure for our use case: at minimum an "Admin org" and a "Security org" (can reuse/relabel the sample's Org1/Org2). Document which real-world role maps to which org (Admin, Security Officer) for the pitch narrative. | Org structure defined and documented |
| 3 | Study `AccessControl.sol` and `MultiSigAdmin.sol` closely. Start writing the **access-control chaincode** in Go: log a decision (asset ID, requester, risk score, outcome, timestamp), get log count, get log by index — ported from `AccessControl.sol`. | `access-control` chaincode in progress |
| 4 | Finish and unit-test the access-control chaincode via Fabric CLI. Make sure decision logs are truly append-only (no update/delete function exists — verify this explicitly, it's a security requirement). | `access-control` chaincode complete, append-only verified |
| 5 | Deploy access-control chaincode alongside Avikrit's identity/asset chaincodes. Run a full CLI flow: register identity → mint asset → log a decision → query the log. | All 3 chaincodes working together via CLI |
| 6 | **Configure the multi-org endorsement policy** — require both Admin org and Security org to endorse any transaction minting a Restricted-classification asset. Test it by attempting a mint with only one org's endorsement (should fail) and then with both (should succeed). This replaces `MultiSigAdmin.sol` entirely. | Working, tested endorsement policy — your strongest security talking point |
| 7 | Start on the risk-engine port: take the existing `riskEngine.js` logic (already well-written, mostly reusable as-is) and integrate it into the Node.js backend as a service module, called before submitting a decision to the access-control chaincode. | Risk engine ported into backend as a callable service |
| 8 | Build the REST routes for access-request and decision-logging, wiring the risk engine output into the access-control chaincode call via the Gateway SDK. Test with Postman/curl, including a case that should trigger the endorsement policy. | Working access-request + decision-logging endpoints |
| 9 | Support frontend's integration of Risk Decision (Safeer) and Audit Log (Nazima) against your endpoints. Pay special attention to how "endorsement pending" should be represented in the API response so frontend can show a clear waiting state. | Endorsement-pending response shape confirmed with Safeer |
| 10 | Test the full pending-approval flow end-to-end: submit a Restricted-asset request, have it wait on Security org's endorsement, manually approve via CLI, confirm the change reflects correctly through to the frontend. | Verified end-to-end multi-org approval flow |
| 11 | Write your section of `docs/security-review.md` covering the endorsement policy design and why it defends against a single compromised admin key — this is likely to come up in Q&A. | Security review notes for endorsement policy |
| 12 | Full-team rehearsal support — you should be ready to personally demo the "compromised admin key can't act alone" scenario live via CLI as a backup if the UI demo has issues. | Ready to present the multi-org defense demo |

---

## Ayush — Backend Support (Days 1-4), then Frontend Monitoring (Days 5-12)

See the frontend team plan for Days 5-12. For the backend portion:

| Day | Task | Deliverable |
|---|---|---|
| 1 | Join Avikrit and Jeswin for the Fabric test-network setup — a third set of hands on Docker/certificate troubleshooting is genuinely useful here, and this is the highest-risk setup step in the whole 12 days. | Confirmed working network setup, shared understanding |
| 2 | Help test the network config and org structure Jeswin is defining — a second reviewer catches mistakes before they get baked into chaincode deployed on top. | Reviewed org/channel structure |
| 3-4 | Take on chaincode testing duty: as Avikrit and Jeswin write the identity, asset, and access-control chaincodes, you write and run the Fabric CLI test commands for each function (register, mint, query, log) so bugs surface immediately rather than during Day 5's integration run. | Test command set for all 3 chaincodes, bugs caught early |
| 5 onward | Shift fully to frontend team monitoring/coordination — see the frontend individual plan for your Day 5-12 responsibilities. | — |

---

## Cross-team coordination points

- **Day 6 is non-negotiable**: Avikrit's API contract must reach the
  frontend team the same day, so their mock layer (also built Day 6, per
  the frontend plan) matches reality instead of guesswork.
- **Endorsement-pending state**: Jeswin and Safeer (frontend) need to
  agree on exactly what the API response looks like while a transaction
  is waiting on multi-org approval — this is a new state that didn't
  exist in the Ethereum prototype and is easy to under-specify.
- **No fallback system exists** — every hour saved by not maintaining a
  second stack should go toward hardening and testing the Fabric build.
  If Days 1-2 network setup slips, that slippage has to be absorbed
  later in the schedule (most likely by shortening Days 10-11 polish),
  not by falling back to something else.
- **Security review doc** (`docs/security-review.md`) gets written
  incrementally by whoever built each piece (Avikrit: chaincode
  validation, Jeswin: endorsement policy) — not crammed in on Day 11.
