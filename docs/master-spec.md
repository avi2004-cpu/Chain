# ChainGuard — Master Project Specification (SIH26125 / BEL)

This document is the single source of truth for the whole team. Everyone —
whether working on backend, frontend, or Fabric chaincode — should read this
before writing code, and paste the "Shared Claude Prompt" section into their
own Claude session before asking for any code. This prevents six people from
getting six slightly different (and incompatible) versions of the same system.

---

## 1. What we are building

**Problem statement:** SIH26125 — Bharat Electronics Limited (BEL) wants a
system where digital identity, access control, and asset ownership are
managed through blockchain instead of a centralized database.

**Our core insight (say this to judges):**
> A valid cryptographic signature proves *who signed*, not *whether they
> should be trusted right now*. Static RBAC can't tell the difference between
> the real owner and an attacker holding a stolen key.

**What makes our solution different from a basic DID+NFT+RBAC submission:**
1. Risk-adaptive access control — context (device, location, time) affects
   the access decision, not just role
2. Multi-organization endorsement (Fabric-native) instead of a single admin
   key for sensitive actions
3. Off-chain storage for sensitive documents — only hashes and decisions go
   on the ledger
4. Full immutable audit trail, queryable by an Auditor role

---

## 2. Architecture — four layers

```
Client layer          React web app (+ mobile, future)
        |
Policy & risk layer   Risk engine, policy service, session store
        |
Blockchain layer       Hyperledger Fabric — 4 chaincodes:
                        identity, asset, access-control, (endorsement
                        policy replaces a separate multi-sig chaincode)
        |
Off-chain storage      Encrypted document store — sensitive files never
                        touch the ledger, only their hashes do
```

**Two parallel tracks:**
- **Track A (fallback, already working):** Ethereum/Hardhat/Solidity
  prototype. Keep this working and demoable no matter what.
- **Track B (target, new build):** Hyperledger Fabric v2.5 LTS. This is
  what we present as the production-ready path for BEL.

---

## 3. Why Hyperledger Fabric (not public Ethereum) for BEL

- BEL is a single organization (with internal departments/units) —
  Fabric's **permissioned** model fits an enterprise that controls its own
  membership. Public Ethereum is designed for trustless strangers; BEL
  doesn't need that.
- Fabric's **channels** allow data privacy between departments if needed
  (e.g. a Restricted-clearance channel not visible to all units).
- Fabric's **endorsement policies** natively replace custom multi-sig
  code — configure "requires Admin org AND Security org to approve" at
  the network level instead of writing and auditing your own multi-sig
  smart contract.
- No cryptocurrency/gas fees — appropriate for an internal government system.

---

## 4. Exact software versions — pinned for the whole team

**This is the most important section for avoiding compatibility problems.**
Everyone installs exactly these versions. Do not use `latest`, do not use
whatever your package manager happens to grab.

| Component | Version | Why this version, not newer/older |
|---|---|---|
| Hyperledger Fabric | **v2.5.x LTS** (latest patch, e.g. 2.5.14+) | Current designated LTS release — gets quarterly security patches. v3.0 exists but is newer/less proven for teams new to Fabric; older v2.2 LTS reached end of maintenance and no longer receives security fixes. |
| Fabric CA | **v1.5.19** (or latest 1.5.x patch) | Matches Fabric 2.5.x compatibility, includes latest CVE fixes. |
| Fabric Samples | Use the `release-2.5` branch of `fabric-samples` repo | Matches the pinned Fabric version exactly. |
| Docker | **24.x or later** (any current stable) | Fabric's tooling requires a modern Docker; use whatever stable release your OS package manager provides — don't chase Docker's bleeding edge, it doesn't affect Fabric security. |
| Go (chaincode language) | **1.21.x or later** (Fabric 2.5 requires Go 1.20+; check `fabric-chaincode-go` compatibility) | Use latest patch of a Go version Fabric officially supports — check the fabric-samples README at setup time, as this can shift. |
| Node.js | **20.x LTS** | LTS = long-term support with security patches; avoid odd-numbered Node releases (21, 23) — those are short-lived and not meant for production-style work. |
| Fabric Gateway SDK | `@hyperledger/fabric-gateway` — latest version compatible with Fabric 2.5 | This is the modern SDK; do NOT use the deprecated `fabric-sdk-java`/older Node SDK — Fabric 2.5 replaced those with the Gateway API. |
| React | **18.x** (whatever `npm create vite@latest` gives you as of setup day — pin the exact version once installed, in `package.json`) | Pin once at project start, everyone uses the same `package-lock.json` — do not let individual teammates run `npm update`. |
| Solidity (fallback track only) | 0.8.24, evmVersion cancun | Matches what's already working in the Ethereum prototype — do not change this. |
| OpenZeppelin Contracts (fallback only) | Whatever version is already in `package-lock.json` from the working prototype | Do not upgrade mid-project — this already caused a `mcopy`/EVM-version issue once; changing it again risks new breakage for no benefit this late. |

### The general rule for "is latest more secure, or is any version fine?"

**Neither extreme is right. The secure choice is: latest patch release of
a version the maintainers still actively support (LTS where one exists).**

- Bleeding-edge / brand-new major versions: less battle-tested, may have
  undiscovered bugs, SDKs and tooling may lag behind
- Old / unsupported versions: known vulnerabilities that will never be
  patched — actively dangerous, not "stable"
- **Sweet spot:** the newest patch/minor release within the LTS or
  actively-maintained line (e.g. Fabric 2.5.14, not 2.5.0 and not 3.0.0-beta)

For a defense-sector submission, being able to say "we pinned to the
designated LTS release and can name our exact dependency versions" is
itself a credibility signal — it shows you understand supply-chain
security, not just feature-building.

---

## 5. Repository structure — everyone follows this exactly

```
chainguard/
├── fabric-network/          # Fabric test-network config (from fabric-samples)
├── chaincode/
│   ├── identity/            # Identity registry chaincode (Go)
│   ├── asset/                # Asset registry chaincode (Go)
│   └── access-control/       # Access decision logging chaincode (Go)
├── backend/
│   ├── src/
│   │   ├── gateway/           # Fabric Gateway SDK connection logic
│   │   ├── risk-engine/       # Risk scoring logic (ported from riskEngine.js)
│   │   ├── routes/            # REST API endpoints
│   │   └── server.js
│   └── package.json
├── frontend/                 # Existing ChainGuard React app
│   └── (unchanged structure — see existing project)
├── ethereum-fallback/        # The working Hardhat/Solidity prototype — DO NOT DELETE
├── docs/
│   ├── architecture.md
│   ├── security-review.md
│   └── api-contract.md       # REST endpoint contracts — backend writes, frontend reads
└── README.md
```

**Rule:** nobody restructures folders without telling the whole team first
— this is the #1 cause of "works on my machine" problems.

---

## 6. Security requirements checklist (defense-sector context)

- [ ] No secrets, private keys, or credentials committed to git — use
      `.env` files, add `.env` to `.gitignore` from day one
- [ ] All chaincode functions validate their inputs (reject empty/malformed
      asset IDs, unregistered identities, out-of-range classification values)
- [ ] Sensitive documents are encrypted at rest in off-chain storage —
      never store plaintext classified content, even in a demo
- [ ] No single identity/key can perform a Restricted-classification action
      alone — always goes through the endorsement policy
- [ ] Every access decision (allow/step-up/block) is logged — no silent
      failures
- [ ] Run a static analysis pass on chaincode before finals if time allows
      (Go: `staticcheck`; general: manual review for injection/access-control
      gaps)
- [ ] Document what is explicitly OUT of scope for this prototype (key
      recovery workflow, production HSM key storage, etc.) — judges respect
      honesty about scope more than silence about gaps

---

## 7. Shared Claude prompt — paste this before asking for any code

> Every team member should paste this block into their own Claude
> conversation FIRST, before asking Claude to write any code for this
> project. It ensures everyone gets compatible output.

```
I'm working on a team project called ChainGuard, for Smart India Hackathon
problem statement SIH26125 (Bharat Electronics Limited — decentralized
identity, NFT-based asset ownership, and blockchain-enforced access
control). I'm one of 6 team members and we need our code to be compatible
with each other, so please strictly follow these constraints:

PINNED VERSIONS (do not suggest alternatives or newer versions):
- Hyperledger Fabric v2.5.x LTS (latest patch)
- Fabric CA v1.5.19 (or latest 1.5.x)
- Fabric Samples from the release-2.5 branch
- Go 1.21.x for chaincode
- Node.js 20.x LTS for backend/frontend
- @hyperledger/fabric-gateway (latest version compatible with Fabric 2.5)
  — NOT the deprecated fabric-sdk-java or old Node SDK
- React 18.x (frontend)

ARCHITECTURE (4 layers):
1. Client layer — React frontend
2. Policy & risk layer — Node.js backend with a risk-scoring engine
3. Blockchain layer — Hyperledger Fabric with chaincodes for identity,
   asset registry, and access-control logging; multi-org endorsement
   policy for sensitive actions (not a custom multi-sig contract)
4. Off-chain storage — encrypted document store; only hashes go on-chain

REPO STRUCTURE — use this exact folder layout: [paste section 5 above]

MY ROLE ON THE TEAM: [fill in: e.g. "I'm on the frontend team, working on
the dashboard and risk-decision UI" / "I'm on backend, building the Fabric
Gateway SDK integration"]

SECURITY REQUIREMENTS: This is a defense-sector (BEL) system, so:
- No hardcoded secrets/keys
- All chaincode inputs must be validated
- No single key/identity can approve sensitive (Restricted-classification)
  actions alone
- All access decisions must be logged immutably

Before writing code, please confirm you understand these constraints and
ask me any clarifying questions about my specific task. Then help me with
the following: [describe your specific task here]
```

---

## 8. What to keep updating in this document

As the project evolves, whoever owns a decision should update this file
and share the new version with the team — don't let it go stale while
six people each hold a different mental model of "how the system works."
Suggested owner: whoever is doing documentation (see the 12-day plan).
