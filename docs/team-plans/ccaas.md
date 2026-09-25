# Chaincode Deployment Notes — Read Before Writing Any Chaincode

## We use Chaincode-as-a-Service (CCaaS), not the classic pattern

The classic Fabric chaincode pattern (`peer lifecycle chaincode install` builds
a Docker image containing your compiled binary) repeatedly failed on our
development hardware (8GB RAM, Windows + WSL2 + Docker Desktop) with two
different errors: `broken pipe` on the Docker socket, and `timeout expired
while executing transaction`. Both came from Fabric peer's own internal
Docker build client — a known-flaky code path under WSL2 with resource
constraints, not a problem with the chaincode logic itself.

**Fix: use CCaaS instead.** In this pattern:
- The peer never builds anything — `peer lifecycle chaincode install` just
  installs a tiny `connection.json` descriptor, guaranteed fast.
- Your chaincode runs as its own server (`shim.ChaincodeServer` instead of
  `shim.Start()`), and the peer connects to it over the network.
- `./network.sh deployCCAAS` handles building a small Docker image (via a
  normal `docker build` shell command — NOT the flaky peer-internal path)
  and starting the chaincode container automatically.

This is an officially documented Fabric 2.x pattern (see
`fabric-samples/test-network/CHAINCODE_AS_A_SERVICE_TUTORIAL.md`), not a
workaround — treat it as the correct choice for this project going forward.

## The pattern to follow for every chaincode

1. Write your business logic exactly as normal (contractapi functions,
   validation, etc.) — nothing changes here.
2. `main()` uses this shape instead of `chaincode.Start()`:
   ```go
   chaincode, err := contractapi.NewChaincode(&YourContract{})
   server := &shim.ChaincodeServer{
       CCID:     os.Getenv("CHAINCODE_ID"),
       Address:  os.Getenv("CHAINCODE_SERVER_ADDRESS"),
       CC:       chaincode,
       TLSProps: shim.TLSProperties{Disabled: true},
   }
   server.Start()
   ```
3. Add a `Dockerfile` in the chaincode folder (copy `chaincode/identity/Dockerfile`
   as a template — just a two-stage build: compile with `golang:1.21`, run
   on `alpine:3.19`).
4. Delete any `vendor/` folder before deploying — not needed for this
   approach and just bloats the Docker build context.
5. Run `go mod tidy` after adding the `shim` import, then `go build ./...`
   to confirm it compiles before touching Docker/Fabric at all.
6. Deploy with:
   ```
   cd ~/fabric-samples/test-network
   ./network.sh deployCCAAS -ccn <chaincode-name> -ccp ~/Chain/chaincode/<folder> -c mychannel
   ```
7. Verify: `docker ps` should show two new containers
   (`peer0org1_<name>_ccaas`, `peer0org2_<name>_ccaas`), and
   `docker logs <container>` should show no crash/panic.
8. Test with a real `peer chaincode invoke` / `peer chaincode query` — see
   `chaincode/identity/README.md` for the exact command shape (needs both
   orgs' peer addresses for endorsement, since default policy requires
   majority approval — with 2 orgs, that's both).

## Environment note

If working on Windows: use WSL2 (Ubuntu), not native Windows — Fabric's
tooling assumes Linux. Keep the project cloned inside WSL's own filesystem
(`~/something`, not `/mnt/c/...`) for performance. If also using an AI
coding agent (Codex, etc.), run it from *inside* WSL too (`cd ~/Chain &&
codex`) — running it from Windows trying to reach into WSL via UNC paths
causes access errors.

If your machine has 8GB RAM or less, expect chaincode builds to take a
few minutes — this is normal, not a sign something's broken. Don't
interrupt a build that "looks stuck."