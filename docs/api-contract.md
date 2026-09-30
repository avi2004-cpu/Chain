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
  "metadataHash": "<SHA-256 hash>",
  "organization": "BEL",
  "format": "application/pdf",
  "size": 1048576,
  "description": "Radar blueprint revision 3"
}
```
`metadataHash` may also be sent as `sha256`. `format`/`size` may also be sent
as `fileFormat`/`fileSize`; size is a non-negative integer in bytes. Descriptive
fields are optional. Metadata-bearing requests require the upgraded chaincode;
original requests continue to use `MintAsset`.
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
  "metadataHash": "<SHA-256 hash>",
  "organization": "BEL",
  "format": "application/pdf",
  "size": 1048576,
  "description": "Radar blueprint revision 3"
}
```
Older assets do not have optional metadata until it is backfilled from a
trusted source.

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

## PATCH /assets/:id/metadata
Adds supplied metadata to an existing asset without changing its owner or
classification. Supply at least one field:

```json
{
  "organization": "BEL",
  "format": "application/pdf",
  "size": 1048576,
  "description": "Radar blueprint revision 3",
  "metadataHash": "<SHA-256 hash>"
}
```
The API accepts `sha256`, `fileFormat`, and `fileSize` aliases. Values must
come from a trusted source; the API does not invent metadata.

## Asset chaincode upgrade
From the existing `fabric-samples/test-network` checkout, use the project's
CCAAS deployment script on the existing channel:

```sh
./network.sh deployCCAAS \
  -ccn asset \
  -ccp ~/Chain/Chain/chaincode/asset \
  -c mychannel \
  -ccv <new-version> \
  -ccs <current-committed-sequence-plus-one>
```

Inspect the committed definition to choose the sequence. Do not stop/reset the
network, remove peer volumes, recreate the channel, or clear ledger state.
Backfill legacy metadata only from a trusted source and verify it with
`GET /assets/:id`.

## POST /access/request
**Risk evaluation only. No ledger transaction is created and no `txHash` is returned.**
The requester (when `requesterAddress` is given) is checked against the identity
chaincode; an unregistered or unverifiable address is **BLOCKed** (fails closed).

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
`assetId`, `requesterDID` and `classification` are required. `classification` must
be one of `Public`, `Internal`, `Confidential`, `Restricted`. `requesterAddress`
must match the ledger key exactly (case-sensitive).

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
  "requiresMultiSig": false
}
```
`outcome` is one of `ALLOW`, `STEP_UP`, `BLOCK`. `factors` is an array (the
frontend `FactorBar` renders it directly).

Errors: `400` missing/invalid field, `500` gateway failure.

## POST /access/decision
Commits the user's final decision to Fabric (`LogDecision`). The backend
**recomputes risk from the request body** and never trusts a client-supplied
score, so send the same body as `/access/request` plus `action`.

Request: the `/access/request` body plus
```json
{ "action": "ALLOW" }
```
`action` is `ALLOW` or `DECLINE`.

Response (only after the transaction is **committed**):
```json
{
  "success": true,
  "action": "ALLOW",
  "outcome": "ALLOW",
  "score": 22,
  "txHash": "<fabric transaction id>"
}
```
Rules and errors:
- `ALLOW` is only accepted when the recomputed outcome is `ALLOW`. Otherwise
  **`403`** `{ "error": "Allow denied: risk outcome is STEP_UP", "outcome", "score", ... }`.
  There is currently no way to turn a `STEP_UP` into an allow.
- `DECLINE` is accepted for any outcome.
- `400` missing/invalid field or bad `action`; `502` endorsed but not committed
  (body includes `txHash`); `500` gateway failure.

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
The ledger stores `allowed` and `riskScore` only, so `STEP_UP`, `BLOCK` and a
user `DECLINE` all appear as `allowed: false`. Clients derive a label from
`riskScore` against the thresholds (block >= 70, step-up >= 40).

## GET /health
Response: `{ "status": "ok" }` (does not touch Fabric).
