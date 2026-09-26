// Seed data for the mock API layer. Names are BEL/defense-context assets,
// not "Asset 1" placeholders — swap in whatever the real backend contract
// ends up using once it lands (Day 6).

export const seedAssets = [
  {
    id: "AST-1042",
    name: "Radar Signal Processing Unit",
    classification: "Restricted",
    owner: "did:fabric:eng-a41f9c",
  },
  {
    id: "AST-1043",
    name: "Fire Control Firmware Image",
    classification: "Confidential",
    owner: "did:fabric:eng-a41f9c",
  },
  {
    id: "AST-1044",
    name: "Comms Encryption Keyset",
    classification: "Restricted",
    owner: "did:fabric:admin-0091",
  },
  {
    id: "AST-1045",
    name: "Field Test Report — Q3",
    classification: "Internal",
    owner: "did:fabric:eng-a41f9c",
  },
  {
    id: "AST-1046",
    name: "Vendor Interface Spec",
    classification: "Public",
    owner: "did:fabric:admin-0091",
  },
];

// Per-user "owned assets" lookup. Empty array is a valid, expected value —
// this is how we exercise the Dashboard empty state on purpose.
export const seedOwnership = {
  "did:fabric:eng-a41f9c": ["AST-1042", "AST-1043", "AST-1045"],
  "did:fabric:admin-0091": ["AST-1044", "AST-1046"],
  "did:fabric:eng-newuser": [], // deliberately empty — triggers Dashboard empty state
};

export const seedPendingRequests = [
  { id: "REQ-501", assetId: "AST-1044", status: "Step-Up", requestedAt: "2026-09-24T09:12:00" },
];
