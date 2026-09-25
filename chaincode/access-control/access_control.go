package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/v2/shim"
	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

type AccessControlContract struct {
	contractapi.Contract
}

type AccessLog struct {
	AssetID      string `json:"assetId"`
	RequesterDID string `json:"requesterDid"`
	RiskScore    int    `json:"riskScore"`
	Allowed      bool   `json:"allowed"`
	Timestamp    string `json:"timestamp"`
}

const logCountKey = "LOG_COUNT"

// LogDecision appends a new access decision. Append-only by design — no
// update or delete function exists for log entries.
func (c *AccessControlContract) LogDecision(ctx contractapi.TransactionContextInterface, assetID string, requesterDID string, riskScore int, allowed bool) error {
	if assetID == "" {
		return fmt.Errorf("assetID cannot be empty")
	}
	if requesterDID == "" {
		return fmt.Errorf("requesterDID cannot be empty")
	}
	if riskScore < 0 || riskScore > 100 {
		return fmt.Errorf("riskScore must be between 0 and 100")
	}

	count, err := c.getLogCount(ctx)
	if err != nil {
		return err
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}

	logEntry := AccessLog{
		AssetID:      assetID,
		RequesterDID: requesterDID,
		RiskScore:    riskScore,
		Allowed:      allowed,
		Timestamp:    time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)).UTC().Format(time.RFC3339),
	}

	logJSON, err := json.Marshal(logEntry)
	if err != nil {
		return fmt.Errorf("failed to marshal log entry: %v", err)
	}

	logKey := fmt.Sprintf("LOG_%d", count)
	if err := ctx.GetStub().PutState(logKey, logJSON); err != nil {
		return fmt.Errorf("failed to write log entry: %v", err)
	}

	if err := ctx.GetStub().PutState(logCountKey, []byte(strconv.Itoa(count+1))); err != nil {
		return fmt.Errorf("failed to update log count: %v", err)
	}

	if err := ctx.GetStub().SetEvent("AccessDecided", logJSON); err != nil {
		return fmt.Errorf("failed to emit event: %v", err)
	}

	return nil
}

func (c *AccessControlContract) GetLogCount(ctx contractapi.TransactionContextInterface) (int, error) {
	return c.getLogCount(ctx)
}

func (c *AccessControlContract) GetLog(ctx contractapi.TransactionContextInterface, index int) (string, error) {
	count, err := c.getLogCount(ctx)
	if err != nil {
		return "", err
	}
	if index < 0 || index >= count {
		return "", fmt.Errorf("log index %d out of range (0-%d)", index, count-1)
	}

	logJSON, err := ctx.GetStub().GetState(fmt.Sprintf("LOG_%d", index))
	if err != nil {
		return "", fmt.Errorf("failed to read log entry: %v", err)
	}
	if logJSON == nil {
		return "", fmt.Errorf("log entry %d not found", index)
	}
	return string(logJSON), nil
}

func (c *AccessControlContract) getLogCount(ctx contractapi.TransactionContextInterface) (int, error) {
	countBytes, err := ctx.GetStub().GetState(logCountKey)
	if err != nil {
		return 0, fmt.Errorf("failed to read log count: %v", err)
	}
	if countBytes == nil {
		return 0, nil
	}
	count, err := strconv.Atoi(string(countBytes))
	if err != nil {
		return 0, fmt.Errorf("failed to parse log count: %v", err)
	}
	return count, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&AccessControlContract{})
	if err != nil {
		panic(fmt.Sprintf("Error creating access-control chaincode: %v", err))
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
		panic(fmt.Sprintf("Error starting access-control chaincode server: %v", err))
	}
}