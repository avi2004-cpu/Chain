## Endorsement policy design (owner: Jeswin) - DRAFT

**Policy:** `AND('Org1MSP.peer','Org2MSP.peer')` on the `access-control`
chaincode (Org1 = Admin, Org2 = Security). A transaction commits only if
peers of both orgs endorse it.

**Verified (CLI, Fabric v2.5.16 test network):** Org1-only and Org2-only
invocations were not committed (log count stayed 1); an Org1+Org2
invocation committed (log count 2). Details: `access-control-testing.md`.

**Why native policy instead of a custom multi-sig contract:** enforcement
happens in Fabric's validation phase, so it cannot be bypassed by a bug in
our chaincode, and there is no admin-key list in contract state to steal.

**Limitations (be upfront about these in the demo):**
- The policy is on `access-control` (decision logging). Minting a
  *Restricted* asset in the `asset` chaincode is **not** yet covered by an
  equivalent policy.
- Endorsement is by **peers**, not by named humans. Through the backend,
  the Gateway asks the Org2 peer to endorse automatically, so the policy
  proves two orgs' peers executed the transaction, not that a Security-org
  officer approved it. The CLI demo (explicitly targeting one org's peer)
  shows the policy; a real "second person must approve" control needs a
  chaincode-level check on the client identity/attributes or state-based
  endorsement.
- Chaincode servers run with TLS disabled (`TLSProps.Disabled: true`) -
  acceptable for the local test network only.
