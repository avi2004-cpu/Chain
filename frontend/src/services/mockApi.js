import { seedAssets, seedOwnership, seedPendingRequests } from "../data/assets.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A special test address to deliberately exercise the error state in the UI.
export const ERROR_TEST_ADDRESS = "did:fabric:error-test";

/**
 * getIdentity(address)
 * Real backend contract (expected shape, per docs/api-contract.md once it lands):
 *   { did: string, role: "Admin" | "Engineer", displayName: string }
 */
export async function getIdentity(address) {
  await delay(260);

  if (address === ERROR_TEST_ADDRESS) {
    throw new Error("Identity lookup failed — could not reach identity service.");
  }

  // Demo mapping: alternate role by address so both Admin and Engineer
  // layouts are easy to exercise without special test flags.
  const knownDids = Object.keys(seedOwnership);
  const did = knownDids.includes(address) ? address : knownDids[0];
  const role = did.includes("admin") ? "Admin" : "Engineer";

  return {
    did,
    role,
    displayName: role === "Admin" ? "Admin User" : "Engineer User",
  };
}

/**
 * getDashboardData(userId)
 * Real backend contract (expected shape):
 *   { assets: Asset[], pendingRequests: Request[] }
 * Asset: { id, name, classification, owner }
 */
export async function getDashboardData(userId) {
  await delay(320);

  if (userId === ERROR_TEST_ADDRESS) {
    throw new Error("Could not load dashboard data — try again.");
  }

  const ownedIds = seedOwnership[userId] || [];
  const assets = seedAssets.filter((a) => ownedIds.includes(a.id));
  const pendingRequests = seedPendingRequests.filter((r) =>
    ownedIds.includes(r.assetId)
  );

  return { assets, pendingRequests };
}

/**
 * getAssets({ search, classification })
 * Real backend contract (expected shape): Asset[]
 * Asset: { id, name, classification, unit, size, format, hash, owner }
 */
export async function getAssets({ search = "", classification = "ALL" } = {}) {
  await delay(300);

  const q = search.trim().toLowerCase();
  return seedAssets.filter((a) => {
    const matchesClassification = classification === "ALL" || a.classification === classification;
    const matchesSearch =
      !q || a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.unit.toLowerCase().includes(q);
    return matchesClassification && matchesSearch;
  });
}

// Per-factor risk model. Each condition is scored 0-10 (10 = riskiest);
// weights are percentage points that sum to 100, so summed `weighted`
// values land directly in the 0-100 range shown by RiskGauge/FactorBar.
const DEVICE_RISK = {
  "Hardware Key Attached (FIDO2 Level-3)": 2,
  "Partial Compliance (TPM 2.0)": 5,
  "Unmanaged Device": 9,
};
const LOCATION_RISK = {
  "BEL Bangalore Secure Intranet (10.240.12.8)": 1,
  "Field Operational Unit (Tactical WAN)": 5,
  "External / Off-Premises": 9,
};
const TIME_RISK = {
  "Regular Operational Shift": 2,
  "Off-Hours (22:00 - 05:00)": 8,
};
const CLASSIFICATION_RISK = {
  Public: 1,
  Internal: 3,
  Confidential: 6,
  Restricted: 9,
};

/**
 * computeRisk({ asset, location, deviceStatus, accessTime, purpose })
 * Real backend contract (expected shape):
 *   { outcome: "Allow" | "Step-Up" | "Block", calculatedScore, factors: Factor[] }
 * Factor: { name, weight, riskScore, weighted }
 */
export async function computeRisk({ asset, location, deviceStatus, accessTime }) {
  await delay(780); // roughly matches RiskDecision's own 3-step loading animation

  const factorInputs = [
    { name: "Device Trust", weight: 25, riskScore: DEVICE_RISK[deviceStatus] ?? 5 },
    { name: "Location Anomaly", weight: 20, riskScore: LOCATION_RISK[location] ?? 5 },
    { name: "Time-of-Access", weight: 15, riskScore: TIME_RISK[accessTime] ?? 4 },
    { name: "Asset Classification", weight: 25, riskScore: CLASSIFICATION_RISK[asset?.classification] ?? 5 },
    { name: "Session Behavior", weight: 15, riskScore: 3 },
  ];

  const factors = factorInputs.map((f) => ({ ...f, weighted: (f.riskScore / 10) * f.weight }));
  const calculatedScore = Math.round(factors.reduce((sum, f) => sum + f.weighted, 0));

  const outcome = calculatedScore >= 70 ? "Block" : calculatedScore >= 40 ? "Step-Up" : "Allow";

  return { outcome, calculatedScore, factors };
}

/**
 * signStepUpChallenge({ address, assetId, challenge })
 * Mocks a wallet signature prompt for the step-up flow.
 */
export async function signStepUpChallenge({ address, challenge }) {
  await delay(900);
  const signature =
    "0x" + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return { signature, address, challenge, signedAt: new Date().toISOString() };
}

/**
 * logDecision({ assetId, classification, score, outcome, requester, endorsement })
 * Mocks committing the decision to the Fabric audit-log chaincode.
 */
export async function logDecision(entry) {
  await delay(320);
  const txHash =
    "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return { ...entry, txHash, loggedAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------
// Audit Log + Approvals (Nazima's pages). Mirrors the vanilla-JS mock
// layer from audit-log-prototype-1.html 1:1, just as ES module state
// instead of an IIFE closure.
// ---------------------------------------------------------------------

let seedLogs = [
  { id: "L-1042", timestamp: "2026-09-15T09:12:00", requester: "r.menon", assetId: "AST-2210", classification: "Confidential", outcome: "Allow", txHash: "0x7a1e9f4c2d88af0e3b6c19d7fa402e91c92f" },
  { id: "L-1041", timestamp: "2026-09-15T08:58:00", requester: "k.iyer", assetId: "AST-1187", classification: "Internal", outcome: "Allow", txHash: "0x44bd7712a9fe038c5d21b60ff3c811a0" },
  { id: "L-1040", timestamp: "2026-09-14T17:40:00", requester: "unknown-device-3", assetId: "AST-2210", classification: "Confidential", outcome: "Block", txHash: "0x9f02cc814b7de2903a1f5e6b8907dd1" },
  { id: "L-1039", timestamp: "2026-09-14T15:05:00", requester: "s.rao", assetId: "AST-3390", classification: "Restricted", outcome: "Step-Up", txHash: "0x1c88efb03d99a45c712e8f0d3baa4e" },
  { id: "L-1038", timestamp: "2026-09-14T11:22:00", requester: "a.verma", assetId: "AST-0044", classification: "Public", outcome: "Allow", txHash: "0x5502ac1798f43de0b26c7190bc" },
  { id: "L-1037", timestamp: "2026-09-13T16:10:00", requester: "s.rao", assetId: "AST-3390", classification: "Restricted", outcome: "Endorsed", txHash: "0xba13d048e7c2915fa6038b4401" },
  { id: "L-1036", timestamp: "2026-09-13T10:44:00", requester: "j.thomas", assetId: "AST-1187", classification: "Internal", outcome: "Block", txHash: "0x2edc99a01f7834be5c0d2a75f10" },
  { id: "L-1035", timestamp: "2026-09-12T14:02:00", requester: "k.iyer", assetId: "AST-0044", classification: "Public", outcome: "Allow", txHash: "0x0091ffb3872ce104a5d9ee3c" },
  { id: "L-1034", timestamp: "2026-09-12T09:30:00", requester: "r.menon", assetId: "AST-4471", classification: "Restricted", outcome: "Step-Up", txHash: "0x77aab512e498f0c3d6a72b19" },
];

let seedApprovals = [
  { id: "REQ-2049", assetId: "AST-4471", classification: "Restricted", requester: "r.menon", requiredOrgs: ["BEL-Org", "DefenceOrg"], approvedOrgs: ["BEL-Org"] },
  { id: "REQ-2050", assetId: "AST-5502", classification: "Restricted", requester: "s.rao", requiredOrgs: ["BEL-Org", "DefenceOrg", "Auditor-Org"], approvedOrgs: [] },
];

// Developer-mode simulation flags, toggled from Sidebar's Developer Mode
// modal. Module-level (not React state) since mockApi is the shared
// integration boundary every page's data calls go through.
let devMode = { slow: false, fail: false };
export function setDevMode(next) {
  devMode = { ...devMode, ...next };
}
export function getDevMode() {
  return devMode;
}

export async function getAccessLogs(filters = {}) {
  await delay(devMode.slow ? 1800 : 320);
  if (devMode.fail) throw new Error("The audit-log service did not respond in time.");

  let rows = seedLogs.slice();
  if (filters.classification) rows = rows.filter((r) => r.classification === filters.classification);
  if (filters.outcome) rows = rows.filter((r) => r.outcome === filters.outcome);
  if (filters.from) rows = rows.filter((r) => r.timestamp.slice(0, 10) >= filters.from);
  if (filters.to) rows = rows.filter((r) => r.timestamp.slice(0, 10) <= filters.to);
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.requester.toLowerCase().includes(q) ||
          r.assetId.toLowerCase().includes(q) ||
          r.txHash.toLowerCase().includes(q)
      );
    }
  }
  rows.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return rows;
}

export async function getApprovalStatus() {
  await delay(devMode.slow ? 1800 : 280);
  if (devMode.fail) throw new Error("The approvals service did not respond in time.");
  return seedApprovals.filter((a) => a.approvedOrgs.length < a.requiredOrgs.length);
}

export async function approveOrg(requestId, org) {
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
  return { ...req };
}
