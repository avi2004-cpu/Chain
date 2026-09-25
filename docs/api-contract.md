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

## POST /access/request
Request:
```json
{
  "assetId": "A001",
  "requesterDID": "did:ethr:0xabc...",
  "classification": "Confidential",
  "anomalyDevice": false,
  "anomalyLocation": false,
  "anomalyTime": false,
  "requiresMultiSig": false
}
```
Response:
```json
{
  "score": 15,
  "factors": { "deviceTrust": 5, "locationRisk": 3, "timeWindow": 2, "assetSensitivity": 20 },
  "outcome": "ALLOW",
  "reason": "All risk factors within acceptable thresholds.",
  "thresholds": { "stepUp": 40, "block": 60 },
  "anomalies": []
}
```
`outcome` is one of `ALLOW`, `STEP_UP`, `BLOCK`.

## GET /access/logs
Response: array, most recent first
```json
[
  {
    "assetId": "A001",
    "requesterDid": "did:ethr:0xabc...",
    "riskScore": 15,
    "allowed": true,
    "timestamp": "2026-09-25T10:00:00Z"
  }
]
```