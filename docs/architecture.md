# Architecture

See the four-layer diagram in the master spec. Fill this in with any
architecture decisions made during the build that deviate from the
original plan — keep it current, don't let it go stale.

## Layers
1. Client layer — React frontend
2. Policy & risk layer — Node.js backend, risk engine
3. Blockchain layer — Hyperledger Fabric, 3 chaincodes + endorsement policy
4. Off-chain storage — encrypted document store

## Deviations from the original plan (as built)
- Chaincode runs as Chaincode-as-a-Service (see `team-plans/ccaas.md`), not the classic peer-built Docker path.
- The multi-org endorsement policy (`AND('Org1MSP.peer','Org2MSP.peer')`) is currently set on the **access-control** chaincode. See `security-review.md` for what that does and does not guarantee.
- The backend connects to Fabric with a single Org1 identity via the Gateway SDK; the Gateway collects the Org2 endorsement itself.
- The Approvals page is still a UI mock; it is not backed by chain state.
- The frontend service layer is still named `services/mockApi.js` but talks to the real backend (only Approvals and the step-up signature are simulated).

## Local ports
Frontend `5173` -> backend `4000` -> Fabric peer0.org1 `7051`.
