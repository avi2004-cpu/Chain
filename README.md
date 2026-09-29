# ChainGuard

Decentralized identity, NFT-style asset ownership and blockchain-enforced,
risk-scored access control on Hyperledger Fabric (Smart India Hackathon
SIH26125, BEL).

| Layer | Folder |
|---|---|
| Client (React + Vite) | `frontend/` |
| Policy & risk (Node.js, Fabric Gateway) | `backend/` |
| Blockchain (Go chaincode, CCaaS) | `chaincode/{identity,asset,access-control}` |
| Fabric test network notes | `fabric-network/` |
| Docs | `docs/` (API contract, architecture, security review) |

## Run order
1. Fabric test-network up + chaincodes deployed - `fabric-network/README.md`, `docs/team-plans/ccaas.md`
2. Backend: `cd backend && npm install && cp .env.example .env` (set `FABRIC_CRYPTO_PATH`) `&& npm run dev`
3. Frontend: `cd frontend && npm install && npm run dev` (open http://localhost:5173)
4. Register your MetaMask address (lowercase) once via `POST /identity/register`.

`GET http://localhost:4000/health` checks the backend is up without touching Fabric.
