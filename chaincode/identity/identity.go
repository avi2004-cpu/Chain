package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/hyperledger/fabric-chaincode-go/v2/shim"
	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// IdentityContract provides functions for managing identities on the ledger.
// Owner: Avikrit
type IdentityContract struct {
	contractapi.Contract
}

// Identity represents one registered identity's ledger state.
// Mirrors IdentityRegistry.sol's Identity struct.
type Identity struct {
	DID        string `json:"did"`
	Role       string `json:"role"`
	Registered bool   `json:"registered"`
}

// Valid roles — mirrors the Role enum from IdentityRegistry.sol
var validRoles = map[string]bool{
	"Employee": true,
	"Manager":  true,
	"Auditor":  true,
	"Admin":    true,
}

// RegisterIdentity registers a new identity on the ledger.
// address is used as the ledger key. Only callable by network admins in
// production (enforce via endorsement policy / ACL, not in this function).
func (c *IdentityContract) RegisterIdentity(ctx contractapi.TransactionContextInterface, address string, did string, role string) error {
	if address == "" {
		return fmt.Errorf("address cannot be empty")
	}
	if did == "" {
		return fmt.Errorf("did cannot be empty")
	}
	if !validRoles[role] {
		return fmt.Errorf("invalid role: %s (must be Employee, Manager, Auditor, or Admin)", role)
	}

	existing, err := ctx.GetStub().GetState(address)
	if err != nil {
		return fmt.Errorf("failed to read ledger state: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("identity already registered for address %s", address)
	}

	identity := Identity{
		DID:        did,
		Role:       role,
		Registered: true,
	}

	identityJSON, err := json.Marshal(identity)
	if err != nil {
		return fmt.Errorf("failed to marshal identity: %v", err)
	}

	return ctx.GetStub().PutState(address, identityJSON)
}

// GetRole returns the role associated with an address.
func (c *IdentityContract) GetRole(ctx contractapi.TransactionContextInterface, address string) (string, error) {
	identity, err := c.getIdentity(ctx, address)
	if err != nil {
		return "", err
	}
	return identity.Role, nil
}

// GetDID returns the DID associated with an address.
func (c *IdentityContract) GetDID(ctx contractapi.TransactionContextInterface, address string) (string, error) {
	identity, err := c.getIdentity(ctx, address)
	if err != nil {
		return "", err
	}
	return identity.DID, nil
}

// IsRegistered checks whether an address has a registered identity.
func (c *IdentityContract) IsRegistered(ctx contractapi.TransactionContextInterface, address string) (bool, error) {
	identityJSON, err := ctx.GetStub().GetState(address)
	if err != nil {
		return false, fmt.Errorf("failed to read ledger state: %v", err)
	}
	return identityJSON != nil, nil
}

// getIdentity is an internal helper — not exposed as a chaincode function.
func (c *IdentityContract) getIdentity(ctx contractapi.TransactionContextInterface, address string) (*Identity, error) {
	identityJSON, err := ctx.GetStub().GetState(address)
	if err != nil {
		return nil, fmt.Errorf("failed to read ledger state: %v", err)
	}
	if identityJSON == nil {
		return nil, fmt.Errorf("identity not registered for address %s", address)
	}

	var identity Identity
	if err := json.Unmarshal(identityJSON, &identity); err != nil {
		return nil, fmt.Errorf("failed to unmarshal identity: %v", err)
	}
	return &identity, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&IdentityContract{})
	if err != nil {
		panic(fmt.Sprintf("Error creating identity chaincode: %v", err))
	}

	server := &shim.ChaincodeServer{
		CCID:    os.Getenv("CHAINCODE_ID"),
		Address: os.Getenv("CHAINCODE_SERVER_ADDRESS"),
		CC:      chaincode,
		TLSProps: shim.TLSProperties{
			Disabled: true,
		},
	}

	if err := server.Start(); err != nil {
		panic(fmt.Sprintf("Error starting identity chaincode server: %v", err))
	}
}
