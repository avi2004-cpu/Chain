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
