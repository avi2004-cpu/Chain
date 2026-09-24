<<<<<<< HEAD
package main

// Access-control chaincode — ports AccessControl.sol logic.
// Functions: LogDecision, GetLogCount, GetLog.
// Must be append-only: no update/delete function should exist.
// Owner: Jeswin

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// AccessLog represents one access-control decision.
type AccessLog struct {
	Index        int    `json:"index"`
	AssetID      string `json:"assetID"`
	RequesterDID string `json:"requesterDID"`
	RiskScore    int    `json:"riskScore"`
	Allowed      bool   `json:"allowed"`
	Timestamp    string `json:"timestamp"`
}

// AccessControlContract provides access-control functions.
type AccessControlContract struct {
	contractapi.Contract
}

// LogDecision records an access-control decision.
//
// The log is append-only. There is intentionally no
// UpdateLog or DeleteLog function.
func (c *AccessControlContract) LogDecision(
	ctx contractapi.TransactionContextInterface,
	assetID string,
	requesterDID string,
	riskScore int,
	allowed bool,
) error {

	// Validate asset ID.
	if assetID == "" {
		return fmt.Errorf("asset ID cannot be empty")
	}

	// Validate requester DID.
	if requesterDID == "" {
		return fmt.Errorf("requester DID cannot be empty")
	}

	// Validate risk score.
	if riskScore < 0 || riskScore > 100 {
		return fmt.Errorf("risk score must be between 0 and 100")
	}

	// Get the current number of access logs.
	count, err := c.GetLogCount(ctx)
	if err != nil {
		return fmt.Errorf("failed to get log count: %w", err)
	}

	// The next log gets the next sequential index.
	index := count

	// Create a unique ledger key using the index.
	key := fmt.Sprintf("ACCESSLOG_%d", index)

	// Check that the key does not already exist.
	existing, err := ctx.GetStub().GetState(key)
	if err != nil {
		return fmt.Errorf("failed to check existing log: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("access log %d already exists", index)
	}

	// Get the Fabric transaction timestamp.
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %w", err)
	}

	timestamp := txTimestamp.AsTime().UTC().Format("2006-01-02T15:04:05Z")

	// Create the access log.
	log := AccessLog{
		Index:        index,
		AssetID:      assetID,
		RequesterDID: requesterDID,
		RiskScore:    riskScore,
		Allowed:      allowed,
		Timestamp:    timestamp,
	}

	// Convert the log to JSON.
	logJSON, err := json.Marshal(log)
	if err != nil {
		return fmt.Errorf("failed to serialize access log: %w", err)
	}

	// Store the log on the ledger.
	if err := ctx.GetStub().PutState(key, logJSON); err != nil {
		return fmt.Errorf("failed to store access log: %w", err)
	}

	return nil
}

// GetLogCount returns the number of access-control logs.
func (c *AccessControlContract) GetLogCount(
	ctx contractapi.TransactionContextInterface,
) (int, error) {

	startKey := "ACCESSLOG_"
	endKey := "ACCESSLOG_~"

	iterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return 0, fmt.Errorf("failed to create log iterator: %w", err)
	}
	defer iterator.Close()

	count := 0

	for iterator.HasNext() {
		_, err := iterator.Next()
		if err != nil {
			return 0, fmt.Errorf("failed to iterate access logs: %w", err)
		}

		count++
	}

	return count, nil
}

// GetLog retrieves an access log using its index.
func (c *AccessControlContract) GetLog(
	ctx contractapi.TransactionContextInterface,
	index int,
) (string, error) {

	if index < 0 {
		return "", fmt.Errorf("log index cannot be negative")
	}

	key := fmt.Sprintf("ACCESSLOG_%d", index)

	logJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", fmt.Errorf("failed to read access log: %w", err)
	}

	if logJSON == nil {
		return "", fmt.Errorf("access log %d does not exist", index)
	}

	return string(logJSON), nil
}

// main starts the Access-Control chaincode.
func main() {
	chaincode, err := contractapi.NewChaincode(&AccessControlContract{})
	if err != nil {
		panic(err)
	}

	if err := chaincode.Start(); err != nil {
		panic(err)
	}
}
=======
package main

// Access-control chaincode — ports AccessControl.sol logic.
// Functions: LogDecision, GetLogCount, GetLog.
// Must be append-only: no update/delete function should exist.
// Owner: Jeswin

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// AccessLog represents one access-control decision.
type AccessLog struct {
	Index        int    `json:"index"`
	AssetID      string `json:"assetID"`
	RequesterDID string `json:"requesterDID"`
	RiskScore    int    `json:"riskScore"`
	Allowed      bool   `json:"allowed"`
	Timestamp    string `json:"timestamp"`
}

// AccessControlContract provides access-control functions.
type AccessControlContract struct {
	contractapi.Contract
}

func validateAccessDecision(
	assetID string,
	requesterDID string,
	riskScore int,
) error {
	if assetID == "" {
		return fmt.Errorf("asset ID cannot be empty")
	}

	if requesterDID == "" {
		return fmt.Errorf("requester DID cannot be empty")
	}

	if riskScore < 0 || riskScore > 100 {
		return fmt.Errorf("risk score must be between 0 and 100")
	}

	return nil
}

// LogDecision records an access-control decision.
//
// The log is append-only. There is intentionally no
// UpdateLog or DeleteLog function.
func (c *AccessControlContract) LogDecision(
	ctx contractapi.TransactionContextInterface,
	assetID string,
	requesterDID string,
	riskScore int,
	allowed bool,
) error {

	if err := validateAccessDecision(assetID, requesterDID, riskScore); err != nil {
		return err
	}

	// Get the current number of access logs.
	count, err := c.GetLogCount(ctx)
	if err != nil {
		return fmt.Errorf("failed to get log count: %w", err)
	}

	// The next log gets the next sequential index.
	index := count

	// Create a unique ledger key using the index.
	key := fmt.Sprintf("ACCESSLOG_%d", index)

	// Check that the key does not already exist.
	existing, err := ctx.GetStub().GetState(key)
	if err != nil {
		return fmt.Errorf("failed to check existing log: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("access log %d already exists", index)
	}

	// Get the Fabric transaction timestamp.
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %w", err)
	}

	timestamp := txTimestamp.AsTime().UTC().Format("2006-01-02T15:04:05Z")

	// Create the access log.
	log := AccessLog{
		Index:        index,
		AssetID:      assetID,
		RequesterDID: requesterDID,
		RiskScore:    riskScore,
		Allowed:      allowed,
		Timestamp:    timestamp,
	}

	// Convert the log to JSON.
	logJSON, err := json.Marshal(log)
	if err != nil {
		return fmt.Errorf("failed to serialize access log: %w", err)
	}

	// Store the log on the ledger.
	if err := ctx.GetStub().PutState(key, logJSON); err != nil {
		return fmt.Errorf("failed to store access log: %w", err)
	}

	return nil
}

// GetLogCount returns the number of access-control logs.
func (c *AccessControlContract) GetLogCount(
	ctx contractapi.TransactionContextInterface,
) (int, error) {

	startKey := "ACCESSLOG_"
	endKey := "ACCESSLOG_~"

	iterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return 0, fmt.Errorf("failed to create log iterator: %w", err)
	}
	defer iterator.Close()

	count := 0

	for iterator.HasNext() {
		_, err := iterator.Next()
		if err != nil {
			return 0, fmt.Errorf("failed to iterate access logs: %w", err)
		}

		count++
	}

	return count, nil
}

// GetLog retrieves an access log using its index.
func (c *AccessControlContract) GetLog(
	ctx contractapi.TransactionContextInterface,
	index int,
) (string, error) {

	if index < 0 {
		return "", fmt.Errorf("log index cannot be negative")
	}

	key := fmt.Sprintf("ACCESSLOG_%d", index)

	logJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", fmt.Errorf("failed to read access log: %w", err)
	}

	if logJSON == nil {
		return "", fmt.Errorf("access log %d does not exist", index)
	}

	return string(logJSON), nil
}

// main starts the Access-Control chaincode.
func main() {
	chaincode, err := contractapi.NewChaincode(&AccessControlContract{})
	if err != nil {
		panic(err)
	}

	if err := chaincode.Start(); err != nil {
		panic(err)
	}
}
>>>>>>> ff1437386be7c3518ff40e0e472a41b048fde729
