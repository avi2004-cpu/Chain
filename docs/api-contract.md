# API Contract

Base URL (local dev): `http://localhost:4000`

## POST /identity/register
Request:
```json
{ "address": "0xabc...", "did": "did:ethr:0xabc...", "role": "Employee" }
```
Response:
```json
{ "success": true }
```

## GET /identity
Lists all registered identities (admin console). Requires identity chaincode v1.1+.
Response: `[ { "address": "0xabc...", "did": "did:ethr:0xabc...", "role": "Admin", "registered": true } ]`

## GET /identity/:address
Response:
```json
{
  "address": "0xabc...",
  "role": "Employee",
  "did": "did:ethr:0xabc...",
  "registered": true
}
```

## POST /assets/mint
Request:
```json
{
  "id": "A001",
  "name": "Radar Blueprint v3",
  "classification": "Confidential",
  "ownerDID": "did:ethr:0xabc...",
  "metadataHash": "hash-blueprint-v3"
}
```
Response:
```json
{ "success": true }
```

## GET /assets/:id
Response:
```json
{
  "id": "A001",
  "name": "Radar Blueprint v3",
  "classification": "Confidential",
  "ownerDID": "did:ethr:0xabc...",
  "metadataHash": "hash-blueprint-v3"
}
```

## POST /assets/:id/transfer
Request:
```json
{ "newOwnerDID": "did:ethr:0xdef..." }
```
Response:
```json
{ "success": true }
```

## GET /assets
Response: array of assets (same shape as `GET /assets/:id`).

## POST /access/request
Scores the request with the risk engine, then logs the decision to the
access-control chaincode. The response is only sent once the log
transaction has been **committed** to the ledger.

Request:
```json
{
  "assetId": "A001",
  "requesterDID": "did:ethr:0xabc...",
  "requesterAddress": "0xabc...",
  "classification": "Confidential",
  "anomalyDevice": false,
  "anomalyLocation": false,
  "anomalyTime": false,
  "requiresMultiSig": false
}
```
`requesterAddress` is optional. When present it is checked against the
identity chaincode; an unregistered (or unverifiable) address is
**BLOCKed** (fails closed). `classification` must be one of `Public`,
`Internal`, `Confidential`, `Restricted`.

Response:
```json
{
  "score": 30,
  "outcome": "ALLOW",
  "reason": "All risk factors are within acceptable thresholds.",
  "factors": [
    { "name": "Device Trust", "weight": 25, "riskScore": 2, "weighted": 5 },
    { "name": "Location Anomaly", "weight": 20, "riskScore": 1, "weighted": 2 },
    { "name": "Time-of-Access", "weight": 15, "riskScore": 2, "weighted": 3 },
    { "name": "Asset Classification", "weight": 25, "riskScore": 6, "weighted": 15 },
    { "name": "Session Behavior", "weight": 15, "riskScore": 3, "weighted": 4.5 }
  ],
  "thresholds": { "stepUp": 40, "block": 70 },
  "anomalies": [],
  "identity": { "registered": true, "role": null },
  "asset": { "classification": "Confidential", "ownerDID": null },
  "requiresMultiSig": false,
  "txHash": "<fabric transaction id>"
}
```
`outcome` is one of `ALLOW`, `STEP_UP`, `BLOCK`. `factors` is an array
(the frontend `FactorBar` renders it directly).

Errors: `400` missing/invalid field, `502` transaction endorsed but not
committed (body includes `txHash`), `500` Fabric/gateway failure.

## GET /access/logs
Response: array, most recent first
```json
[
  {
    "assetId": "A001",
    "requesterDid": "did:ethr:0xabc...",
    "classification": "Confidential",
    "riskScore": 15,
    "allowed": true,
    "txId": "<fabric transaction id>",
    "timestamp": "2026-09-25T10:00:00Z"
  }
]
```
The ledger stores `allowed` only, so `STEP_UP` and `BLOCK` both appear
as `allowed: false`.

## GET /health
Response: `{ "status": "ok" }` (does not touch Fabric).
