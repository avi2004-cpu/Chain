# Access-Control Chaincode Testing

## Overview

The ChainGuard Access-Control chaincode was deployed and tested on a Hyperledger Fabric v2.5.16 test network.

## Endorsement Policy

The Access-Control chaincode uses the native Fabric endorsement policy:

`AND('Org1MSP.peer','Org2MSP.peer')`

Both Org1MSP and Org2MSP endorsements are required for a transaction to be committed.

## Endorsement Tests

### Org1 only

Org1-only transaction was not committed. GetLogCount remained 1.

### Org2 only

Org2-only transaction was not committed. GetLogCount remained 1.

### Org1 + Org2

Transaction using both organizations was committed successfully.

Asset: BEL-DRONE-002

Requester: DID-USER-002

Risk score: 85

Allowed: false

GetLogCount increased to 2.

## Input Validation Tests

The following invalid inputs were rejected:

- Risk score -1
- Risk score 101
- Empty asset ID
- Empty requester DID
- Negative log index
- Nonexistent log

## Access Log Design

Access logs are append-only. Each log contains the index, asset ID, requester DID, risk score, access decision, and Fabric transaction timestamp.

There are intentionally no update or delete functions for access logs.

## Current Status

The Access-Control chaincode and native multi-organization endorsement policy have been deployed and manually verified on the Fabric test network.

Automated unit tests are still pending.
