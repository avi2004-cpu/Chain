// Seed data for the mock API layer. Names are BEL/defense-context assets,
// not "Asset 1" placeholders — swap in whatever the real backend contract
// ends up using once it lands (Day 6).

export const seedAssets = [
  {
    id: "AST-1042",
    name: "Radar Signal Processing Unit",
    classification: "Restricted",
    owner: "did:fabric:eng-a41f9c",
    unit: "Radar Systems Division",
    size: "42.8 MB",
    format: "Binary",
    hash: "a94f7c31e8b0d5f2119c6a3d0e7b4f582c9a1d6e3b7f0a4c8d1e5f2a9b6c3d70",
  },
  {
    id: "AST-1043",
    name: "Fire Control Firmware Image",
    classification: "Confidential",
    owner: "did:fabric:eng-a41f9c",
    unit: "Fire Control Division",
    size: "8.2 MB",
    format: "Binary",
    hash: "3b8e1f4a7c2d9058f1e6b4a0c7d3e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0",
  },
  {
    id: "AST-1044",
    name: "Comms Encryption Keyset",
    classification: "Restricted",
    owner: "did:fabric:admin-0091",
    unit: "Secure Communications Division",
    size: "128 KB",
    format: "Keyset",
    hash: "e1d4a7b0c3f6928e5b8c1d4f7a0e3b6c9d2f5a8b1c4d7e0f3a6b9c2d5e8f1a4b",
  },
  {
    id: "AST-1045",
    name: "Field Test Report — Q3",
    classification: "Internal",
    owner: "did:fabric:eng-a41f9c",
    unit: "R&D Division",
    size: "3.4 MB",
    format: "PDF",
    hash: "9c2f5a8b1d4e7f0a3c6b9d2e5f8a1c4b7d0e3f6a9c2d5b8e1f4a7c0d3e6b9f2",
  },
  {
    id: "AST-1046",
    name: "Vendor Interface Spec",
    classification: "Public",
    owner: "did:fabric:admin-0091",
    unit: "Vendor Relations Division",
    size: "1.1 MB",
    format: "PDF",
    hash: "5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f81",
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
