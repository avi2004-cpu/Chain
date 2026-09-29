# Backend

Node.js API layer connecting the frontend to Hyperledger Fabric via the
Fabric Gateway SDK. See docs/api-contract.md for the exact endpoints to
implement — do not invent shapes that aren't documented there.

## Setup
```
cd backend
npm install
cp .env.example .env   # fill in real values once chaincode is deployed
npm run dev
```
