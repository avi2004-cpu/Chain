# ChainGuard — Technology Stack

> **Project:** ChainGuard  
> **Problem Statement:** SIH26125 — Bharat Electronics Limited (BEL)  
> **Frontend Branch:** `FRONTEND`  
> **Purpose:** Shared technology and version reference for the ChainGuard team.

---

## 1. Overview

ChainGuard is a blockchain-based security control plane for managing:

- Digital identity
- Asset ownership
- Risk-adaptive access control
- Multi-organization approval
- Immutable audit logging
- Secure off-chain document storage

The system is organized into four primary layers:

```text
┌──────────────────────────────────────┐
│           Client Layer              │
│          React Web Application      │
└──────────────────┬───────────────────┘
                   │ REST API
┌──────────────────▼───────────────────┐
│        Policy & Risk Layer          │
│     Node.js + Risk Engine           │
└──────────────────┬───────────────────┘
                   │ Fabric Gateway
┌──────────────────▼───────────────────┐
│         Blockchain Layer            │
│       Hyperledger Fabric 2.5        │
│                                    │
│ Identity │ Asset │ Access Control  │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│        Off-Chain Storage             │
│     Encrypted Document Store         │
└──────────────────────────────────────┘
```

---

# 2. Frontend Stack

## Core

| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | Frontend application framework |
| Node.js | 20.x LTS | JavaScript runtime and frontend tooling |
| JavaScript | ES6+ | Application logic |
| HTML5 | — | Semantic markup |
| CSS3 | — | Styling and responsive layout |

## UI / Design System

The frontend follows the shared ChainGuard/DecentraVault design system.

### Typography

- **Inter** — primary UI font
- **IBM Plex Mono** — identifiers and technical values

IBM Plex Mono is used for values such as:

- Asset IDs
- DIDs
- Transaction hashes
- Request IDs
- Timestamps
- Blockchain identifiers

### Design approach

The frontend uses:

- CSS custom properties for theme tokens
- Light and dark themes
- Responsive layouts
- Reusable components
- Dense data-oriented console UI
- Status badges
- Metric cards
- Toolbars and filters
- Drawers
- Modals
- Toast notifications
- Loading skeletons
- Empty states
- Error states

---

# 3. Frontend Architecture

Recommended structure:

```text
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar/
│   │   ├── ClassificationBadge/
│   │   ├── RiskGauge/
│   │   ├── FactorBar/
│   │   ├── MetricCard/
│   │   ├── Drawer/
│   │   ├── Modal/
│   │   └── Toast/
│   │
│   ├── pages/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── AssetRequest/
│   │   ├── RiskDecision/
│   │   ├── AuditLog/
│   │   └── Admin/
│   │
│   ├── services/
│   │   ├── api.js
│   │   └── mockApi.js
│   │
│   ├── data/
│   │   └── assets.js
│   │
│   ├── context/
│   │   └── WalletContext.jsx
│   │
│   ├── styles/
│   │   └── theme.css
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
├── package-lock.json
└── README.md
```

---

# 4. Shared Frontend Components

### `Navbar`

Common application navigation and sidebar shell.

### `ClassificationBadge`

Displays asset classification:

```text
Public
Internal
Confidential
Restricted
```

### `RiskGauge`

Visual representation of the calculated risk score.

### `FactorBar`

Displays individual risk factors contributing to the overall risk score.

### `MetricCard`

Used for dashboard and audit-log KPI summaries.

### `Drawer`

Used when displaying detailed information about a single record.

### `Modal`

Used for settings-style interactions.

### `Toast`

Used for short-lived action confirmations.

---

# 5. Frontend Pages

| Page | Owner |
|---|---|
| Login | Abdullah |
| Dashboard | Abdullah |
| Asset Request | Safeer |
| Risk Decision | Safeer |
| Audit Log | Nazima |
| Admin / Approvals | Nazima |
| Shared Components / Monitoring | Ayush |

Integration order:

```text
Login / Identity
        ↓
Asset Request
        ↓
Risk Decision
        ↓
Audit Log
```

---

# 6. Backend Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20.x LTS | Backend runtime |
| REST API | — | Frontend/backend communication |
| @hyperledger/fabric-gateway | Fabric 2.5 compatible | Backend → Fabric communication |
| Risk Engine | Project implementation | Risk scoring and access decisions |

The backend exposes REST routes based on the shared API contract.

---

# 7. Blockchain Stack

## Hyperledger Fabric

**Version:** `v2.5.x LTS`

Fabric is the target blockchain platform for ChainGuard.

It is used for:

- Identity registry
- Asset registry
- Access-control decision logging
- Multi-organization endorsement

## Fabric CA

**Version:** `v1.5.19` or latest compatible 1.5.x patch.

Used for Fabric identity and certificate management.

## Fabric Samples

Use the:

```text
release-2.5
```

branch of `fabric-samples`.

## Fabric Chaincode

**Language:** Go

**Version:** Go 1.21.x or later compatible with Fabric 2.5.

Chaincodes:

```text
chaincode/
├── identity/
├── asset/
└── access-control/
```

---

# 8. Fabric Chaincodes

### Identity Chaincode

Responsible for:

- Registering identities
- Storing DID
- Storing role
- Checking registration
- Retrieving identity information

### Asset Chaincode

Responsible for:

- Asset creation/minting
- Asset classification
- Asset ownership
- Metadata hash
- Ownership transfer

### Access-Control Chaincode

Responsible for:

- Recording access decisions
- Recording risk scores
- Recording requester information
- Recording timestamps
- Providing audit-log queries

Decision logs are intended to be append-only.

---

# 9. Multi-Organization Endorsement

Sensitive actions involving `Restricted` assets use Fabric endorsement policies.

The intended policy requires approval from:

```text
Admin Organization
        +
Security Organization
        ↓
Transaction approved
```

This uses Fabric-native endorsement policies rather than a custom multi-signature contract.

---

# 10. Development Environment

| Tool | Requirement |
|---|---|
| Node.js | 20.x LTS |
| React | 18.x |
| Go | 1.21.x+ |
| Hyperledger Fabric | 2.5.x LTS |
| Fabric CA | 1.5.x |
| Docker | 24.x+ |
| Git | Version-controlled development |
| Fabric Samples | `release-2.5` |

---

# 11. API Communication

The frontend communicates with the backend through REST APIs.

Example endpoints:

```text
POST /identity/register

POST /assets/mint

GET /assets/:id
```

The complete API contract is owned by the backend team.

The frontend should not independently invent request/response structures.

---

# 12. Mock API Layer

Before backend integration, frontend pages use a mock API layer.

The mock layer should:

1. Use asynchronous functions.
2. Simulate network latency.
3. Read/write seed data.
4. Match real API response shapes.
5. Support loading states.
6. Support errors.
7. Be replaceable with real API calls without changing page-level logic.

Example:

```javascript
const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function getAccessLogs(filters) {
  await delay(280);

  let rows = [...seedLogs];

  // Apply filters here.

  return rows;
}
```

---

# 13. Application States

Every asynchronous list/detail view must handle four states:

```text
Loading
   ↓
Success ──────→ Data available
   │
   └──────────→ Empty state

Failure
   ↓
Error + Retry
```

### Loading

Use skeleton rows/placeholders.

### Success

Display the returned data.

### Empty

Display:

- Icon
- Title
- Explanation
- Relevant action

### Error

Display:

- Error icon
- Error title
- Error message
- Retry button

---

# 14. Security Technology Requirements

The project is designed for a BEL/defense-sector context.

Frontend and backend code must follow these rules:

- Never commit private keys.
- Never commit API secrets.
- Never commit credentials.
- Use environment variables for secrets.
- Add `.env` to `.gitignore`.
- Validate API inputs.
- Do not expose sensitive document contents unnecessarily.
- Treat `Restricted` assets as requiring multi-organization endorsement.
- Ensure every access decision is logged.

---

# 15. Repository Technology Map

```text
chainguard/
│
├── frontend/                  # React 18 frontend
│   ├── src/
│   ├── package.json
│   └── package-lock.json
│
├── backend/                   # Node.js 20 backend
│   ├── src/
│   │   ├── gateway/           # Fabric Gateway
│   │   ├── risk-engine/       # Risk scoring
│   │   ├── routes/             # REST API
│   │   └── server.js
│   └── package.json
│
├── chaincode/
│   ├── identity/              # Go chaincode
│   ├── asset/                 # Go chaincode
│   └── access-control/        # Go chaincode
│
├── fabric-network/            # Fabric network configuration
│
├── ethereum-fallback/         # Existing fallback prototype
│
├── docs/
│   ├── architecture.md
│   ├── security-review.md
│   └── api-contract.md
│
└── README.md
```

---

# 16. Version Locking Rules

All team members must use the same dependency versions.

### Use

```bash
npm install
```

with the committed lockfile.

### Avoid

```bash
npm update
```

individual dependencies without team agreement.

Do not introduce major framework or dependency changes without coordinating with the team.

---

# 17. FRONTEND Branch Responsibility

The `FRONTEND` branch contains the React client-side implementation.

It should contain:

```text
FRONTEND
│
├── React application
├── Shared UI components
├── Pages
├── Styling / design tokens
├── Mock API layer
├── Frontend data models
└── Frontend documentation
```

Backend, chaincode, and Fabric network implementation should remain on their respective development branches until integration.

---

# 18. Source of Truth

### Frontend visual implementation

```text
audit-log-prototype-1.html
        ↓
references/design-system.md
        ↓
SKILL.md
        ↓
React implementation
```

### Architecture and versions

```text
ChainGuard Master Project Specification
```

This document should be treated as the project-wide reference for architecture and pinned technology versions.

---

# 19. Quick Reference

```text
FRONTEND
  React 18
  Node.js 20 LTS
  JavaScript
  HTML5
  CSS3
  Inter
  IBM Plex Mono

BACKEND
  Node.js 20 LTS
  REST API
  @hyperledger/fabric-gateway
  Risk Engine

BLOCKCHAIN
  Hyperledger Fabric 2.5.x LTS
  Fabric CA 1.5.x
  Go 1.21.x+
  Fabric Chaincode

INFRASTRUCTURE
  Docker 24.x+
  Fabric Samples release-2.5

STORAGE
  Encrypted off-chain document store
  Blockchain stores hashes / decisions

DEVELOPMENT
  Git
  Shared package-lock.json
  Mock API → Real API integration
```
