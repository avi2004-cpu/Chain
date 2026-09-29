# Admin console

Frontend page `frontend/src/pages/Admin/Admin.jsx` (ported from the old
standalone `admin.html` mock). Shown in the sidebar only when the wallet's
on-chain role is `Admin`.

| Panel | Source |
|---|---|
| Assets, classification bars | `GET /assets` |
| Decisions logged, Not allowed, 12h chart, recent decisions | `GET /access/logs` |
| Pending endorsements | **Mock** (Approvals page data) |
| Identities tab | `GET /identity` -> `GetAllIdentities` (needs chaincode v1.1) |

## Upgrade the identity chaincode (needed only for the Identities tab)
`GetAllIdentities` was added to `chaincode/identity/identity.go`. Redeploy
with a new version + sequence, e.g. from `fabric-samples/test-network`:
```
./network.sh deployCCAAS -ccn identity -ccp <path>/chaincode/identity -c mychannel -ccv 1.1 -ccs 2
```
Overview works without this; Identities shows an "unavailable" message.

## Security note
Hiding the Admin item is UI only. The backend has no authentication, so
anyone who can reach port 4000 can call `GET /identity`. Fine for a local
demo; say so in the security review and do not expose the port.
