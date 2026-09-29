const API_BASE = "http://localhost:4000";

let lastTxHash = null; // captured from computeRisk, reused by logDecision below

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export async function getIdentity(address) {
  const data = await apiFetch(`/identity/${address}`);
  const role = data.role === "Admin" ? "Admin" : "Engineer"; // UI currently only distinguishes these two
  return {
    did: data.did,
    role,
    displayName: role === "Admin" ? "Admin User" : "Engineer User",
  };
}

export async function getDashboardData(userId) {
  const allAssets = await apiFetch(`/assets`);
  const assets = allAssets.filter((a) => a.ownerDID === userId);
  return { assets, pendingRequests: [] }; // no backend concept of "pending" yet — documented simplification
}

export async function getAssets({ search = "", classification = "ALL" } = {}) {
  const allAssets = await apiFetch(`/assets`);
  const q = search.trim().toLowerCase();
  return allAssets.filter((a) => {
    const matchesClassification = classification === "ALL" || a.classification === classification;
    const matchesSearch = !q || a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    return matchesClassification && matchesSearch;
  });
}

const OUTCOME_MAP = { ALLOW: "Allow", STEP_UP: "Step-Up", BLOCK: "Block" };
const FACTOR_MAX = { deviceTrust: 30, locationRisk: 25, timeWindow: 20, assetSensitivity: 30 };
const FACTOR_NAME = {
  deviceTrust: "Device Trust",
  locationRisk: "Location Anomaly",
  timeWindow: "Time-of-Access",
  assetSensitivity: "Asset Classification",
};

export async function computeRisk({ asset, location, deviceStatus, accessTime, requesterDID }) {
  const body = {
    assetId: asset.id,
    requesterDID,
    classification: asset.classification,
    anomalyDevice: deviceStatus === "Unmanaged Device",
    anomalyLocation: location === "External / Off-Premises",
    anomalyTime: accessTime === "Off-Hours (22:00 - 05:00)",
    requiresMultiSig: asset.classification === "Restricted",
  };

  const data = await apiFetch(`/access/request`, { method: "POST", body: JSON.stringify(body) });
  lastTxHash = data.txHash || null;

  const factors = Object.entries(data.factors).map(([key, value]) => {
    const max = FACTOR_MAX[key] ?? 30;
    return {
      name: FACTOR_NAME[key] ?? key,
      weight: max,
      riskScore: Math.round((value / max) * 10),
      weighted: value,
    };
  });

  return {
    outcome: OUTCOME_MAP[data.outcome] ?? "Allow",
    calculatedScore: data.score,
    factors,
  };
}

export async function signStepUpChallenge({ address, challenge }) {
  // No real backend equivalent — this stays a simulated wallet-signature UX
  // gate in front of the already-logged real decision above.
  await new Promise((r) => setTimeout(r, 900));
  const signature = "0x" + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return { signature, address, challenge, signedAt: new Date().toISOString() };
}

export async function logDecision(entry) {
  // The real log write already happened inside computeRisk's backend call.
  // This just surfaces the real transaction ID captured from that call.
  return { ...entry, txHash: lastTxHash || "pending", loggedAt: new Date().toISOString() };
}

// --- Audit Log + Approvals ---

export async function getAccessLogs(filters = {}) {
  const rows = await apiFetch(`/access/logs`);
  let result = rows.map((r) => ({
    id: r.txId,
    timestamp: r.timestamp,
    requester: r.requesterDid,
    assetId: r.assetId,
    classification: r.classification,
    outcome: r.allowed ? "Allow" : "Block",
    txHash: r.txId,
  }));
  if (filters.classification) result = result.filter((r) => r.classification === filters.classification);
  if (filters.outcome) result = result.filter((r) => r.outcome === filters.outcome);
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter(
      (r) => r.requester.toLowerCase().includes(q) || r.assetId.toLowerCase().includes(q) || (r.txHash || "").toLowerCase().includes(q)
    );
  }
  return result;
}

// Approvals: kept fully mocked — Fabric's actual endorsement policy enforces
// multi-org approval automatically at the network level (already proven via
// your deployCCAAS approve/commit flow), not via a queryable per-request
// approval list. Building that tracking is future work, not a quick fix.
let seedApprovals = [
  { id: "REQ-2049", assetId: "AST-4471", classification: "Restricted", requester: "r.menon", requiredOrgs: ["BEL-Org", "DefenceOrg"], approvedOrgs: ["BEL-Org"] },
];
export async function getApprovalStatus() {
  await new Promise((r) => setTimeout(r, 280));
  return seedApprovals.filter((a) => a.approvedOrgs.length < a.requiredOrgs.length);
}
export async function approveOrg(requestId, org) {
  await new Promise((r) => setTimeout(r, 240));
  const req = seedApprovals.find((a) => a.id === requestId);
  if (!req) return;
  if (!req.approvedOrgs.includes(org)) req.approvedOrgs.push(org);
  return { ...req };
}

let devMode = { slow: false, fail: false };
export function setDevMode(next) { devMode = { ...devMode, ...next }; }
export function getDevMode() { return devMode; }