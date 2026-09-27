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
