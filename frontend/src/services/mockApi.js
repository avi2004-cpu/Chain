const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

// Single place for backend HTTP. Errors carry `status` and `data` so callers can
// tell a 403 (policy refusal) from a network failure.
async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error(
      `Cannot reach the ChainGuard backend at ${API_BASE}. Check that it is running and that this origin is allowed by CORS.`
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// GET /identity/:address is exact-match on the ledger key, but wallets (MetaMask)
// return mixed-case addresses. Try the exact route first, then fall back to a
// case-insensitive match over GET /identity. Never invents an identity.
async function findIdentity(address) {
  try {
    const data = await apiFetch(`/identity/${encodeURIComponent(address)}`);
    if (data.registered !== false) return data;
  } catch (err) {
    if (err.status !== 404) throw err;
  }
  const notRegistered = new Error("This wallet is not registered on the identity chaincode.");
  let all;
  try {
    all = await apiFetch(`/identity`);
  } catch {
    throw notRegistered;
  }
  const needle = String(address).toLowerCase();
  const match = Array.isArray(all)
    ? all.find((i) => String(i.address).toLowerCase() === needle || String(i.did).toLowerCase() === needle)
    : null;
  if (!match) throw notRegistered;
  return match;
}

// The backend checks the requester against the ledger key exactly, so send the
// canonical (as-registered) address, not whatever casing the wallet returned.
const canonicalCache = new Map();
async function canonicalAddress(address) {
  if (!address) return address;
  if (canonicalCache.has(address)) return canonicalCache.get(address);
  try {
    const found = await findIdentity(address);
    canonicalCache.set(address, found.address || address);
    return found.address || address;
  } catch {
    return address; // unregistered: send as-is and let the backend fail closed (BLOCK)
  }
}

export async function getIdentity(address) {
  const data = await findIdentity(address);
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
    owner: a.ownerDID ?? "—",
    hash: typeof a.metadataHash === "string" ? a.metadataHash : "",
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
    const matchesSearch =
      !q || String(a.id ?? "").toLowerCase().includes(q) || String(a.name ?? "").toLowerCase().includes(q);
    return matchesClassification && matchesSearch;
  });
}

const OUTCOME_MAP = { ALLOW: "Allow", STEP_UP: "Step-Up", BLOCK: "Block" };

function buildAccessRequest({ asset, location, deviceStatus, accessTime, requesterDID, requesterAddress }) {
  return {
    assetId: asset.id,
    requesterDID,
    requesterAddress,
    classification: asset.classification,
    anomalyDevice: deviceStatus === "Unmanaged Device",
    anomalyLocation: location === "External / Off-Premises",
    anomalyTime: accessTime === "Off-Hours (22:00 - 05:00)",
    requiresMultiSig: asset.classification === "Restricted",
  };
}

// POST /access/request: risk evaluation only. Nothing is written to the ledger.
// Never fabricates a result: any failure or malformed reply throws.
export async function computeRisk({ asset, location, deviceStatus, accessTime, requesterDID, requesterAddress }) {
  const request = buildAccessRequest({
    asset,
    location,
    deviceStatus,
    accessTime,
    requesterDID,
    requesterAddress: await canonicalAddress(requesterAddress),
  });

  const data = await apiFetch(`/access/request`, { method: "POST", body: JSON.stringify(request) });

  const outcome = OUTCOME_MAP[data.outcome];
  if (!outcome || typeof data.score !== "number") {
    throw new Error("The backend returned an unrecognised risk result.");
  }

  return {
    outcome,
    calculatedScore: data.score,
    factors: Array.isArray(data.factors) ? data.factors : [],
    reason: typeof data.reason === "string" ? data.reason : "",
    anomalies: Array.isArray(data.anomalies) ? data.anomalies : [],
    // Exactly what was scored. POST /access/decision must re-send it because the
    // backend recomputes risk server-side and never trusts a client-supplied score.
    request,
  };
}

// POST /access/decision: commits the final ALLOW / DECLINE to Fabric (LogDecision).
// Resolves only when the backend confirms a committed transaction ID.
export async function commitDecision({ request, action }) {
  const data = await apiFetch(`/access/decision`, {
    method: "POST",
    body: JSON.stringify({ ...request, action }),
  });
  if (!data.success || !data.txHash) {
    throw new Error("The backend did not confirm a committed ledger transaction.");
  }
  return {
    txHash: data.txHash,
    action: data.action,
    outcome: OUTCOME_MAP[data.outcome] ?? data.outcome,
    score: data.score,
  };
}

export async function signStepUpChallenge({ address, challenge }) {
  // SIMULATED: no backend equivalent yet. The signature is random and is NOT
  // verified by anything. The UI labels it as simulated.
  await new Promise((r) => setTimeout(r, 900));
  const signature = "0x" + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return { signature, address, challenge, signedAt: new Date().toISOString(), simulated: true };
}

// --- Audit Log + Approvals ---

// The ledger stores only `allowed` + riskScore. A not-allowed row is labelled from
// the score against the backend thresholds (block >= 70, step-up >= 40); a user
// decline of a low-risk request has no dedicated label, so it shows as Block.
function outcomeFromLog(r) {
  if (r.allowed) return "Allow";
  if (r.riskScore >= 70) return "Block";
  if (r.riskScore >= 40) return "Step-Up";
  return "Block";
}

export async function getAccessLogs(filters = {}) {
  const rows = await apiFetch(`/access/logs`);
  let result = (Array.isArray(rows) ? rows : []).map((r) => ({
    id: r.txId,
    timestamp: r.timestamp,
    requester: r.requesterDid ?? "",
    assetId: r.assetId ?? "",
    classification: r.classification ?? "",
    riskScore: r.riskScore,
    outcome: outcomeFromLog(r),
    txHash: r.txId ?? "",
  }));
  if (filters.classification) result = result.filter((r) => r.classification === filters.classification);
  if (filters.outcome) result = result.filter((r) => r.outcome === filters.outcome);
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter(
      (r) => r.requester.toLowerCase().includes(q) || r.assetId.toLowerCase().includes(q) || r.txHash.toLowerCase().includes(q)
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
