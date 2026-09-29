# Fabric Network

This folder holds the local Hyperledger Fabric test-network configuration.

## Setup (do this once, ideally together as a team the first time)

1. Clone `fabric-samples` (release-2.5 branch) — do NOT copy it into this
   repo; instead symlink or reference it, since it's large and not our code:
   ```
   git clone -b release-2.5 https://github.com/hyperledger/fabric-samples.git
   ```
2. Follow fabric-samples/test-network setup instructions exactly.
3. Define our org structure here once agreed (Admin org, Security org) —
   document the mapping in this README so everyone uses the same names.

## Org structure (fill in once decided)

| Org name | Real-world role |
|---|---|
| Org1 (`Org1MSP`) | Admin |
| Org2 (`Org2MSP`) | Security |

## Do not commit

Certificates, MSP material, and wallets are gitignored for a reason —
never force-add them even for convenience.
