const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

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
    address,
    did: data.did,
    role,
    displayName: role === "Admin" ? "Admin User" : "Engineer User",
  };
}

// The asset chaincode stores { id, name, classification, ownerDID, metadataHash }.
// The UI was built against richer mock assets (owner, hash, unit, size, format),
// so map chain fields onto UI fields and give the off-chain-only ones a safe
// placeholder instead of letting components crash on undefined.
function toUiAsset(a) {
  return {
    ...a,
    owner: a.ownerDID,
    hash: a.metadataHash || "",
    unit: a.unit || "—",
    size: a.size || "—",
    format: a.format || "—",
  };
}

async function fetchAssets() {
  const rows = await apiFetch(`/assets`);
  return rows.map(toUiAsset);
}

export async function getDashboardData(ownerDID) {
  const allAssets = await fetchAssets();
  // Dashboard shows the caller's own assets; fall back to all if no DID is known.
  const assets = ownerDID ? allAssets.filter((a) => a.owner === ownerDID) : allAssets;
  return { assets, pendingRequests: [] }; // no backend concept of "pending" yet — documented simplification
}

export async function getAssets({ search = "", classification = "ALL" } = {}) {
  const allAssets = await fetchAssets();
  const q = search.trim().toLowerCase();
  return allAssets.filter((a) => {
    const matchesClassification = classification === "ALL" || a.classification === classification;
    const matchesSearch = !q || a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    return matchesClassification && matchesSearch;
  });
}

const OUTCOME_MAP = { ALLOW: "Allow", STEP_UP: "Step-Up", BLOCK: "Block" };

export async function computeRisk({ asset, location, deviceStatus, accessTime, requesterDID, requesterAddress }) {
  const body = {
    assetId: asset.id,
    requesterDID,
    requesterAddress,
    classification: asset.classification,
    anomalyDevice: deviceStatus === "Unmanaged Device",
    anomalyLocation: location === "External / Off-Premises",
    anomalyTime: accessTime === "Off-Hours (22:00 - 05:00)",
    requiresMultiSig: asset.classification === "Restricted",
  };

  const data = await apiFetch(`/access/request`, { method: "POST", body: JSON.stringify(body) });
  lastTxHash = data.txHash || null;

  const factors = Array.isArray(data.factors)
    ? data.factors
    : [];

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

// --- Admin console ---

export async function getAdminOverview() {
  const [assets, logs, pending] = await Promise.all([
    fetchAssets(),
    apiFetch(`/access/logs`),
    getApprovalStatus(), // still mocked - see Approvals note above
  ]);
  return { assets, logs, pendingEndorsements: pending.length };
}

// Needs identity chaincode >= 1.1 (GetAllIdentities). Rejects otherwise.
export async function getIdentities() {
  return apiFetch(`/identity`);
}
