package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
	"github.com/hyperledger/fabric-chaincode-go/v2/shim"
)

type AssetContract struct {
	contractapi.Contract
}

type Asset struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Classification string `json:"classification"`
	OwnerDID       string `json:"ownerDID"`
	MetadataHash   string `json:"metadataHash"`
}

// MintAsset creates a new asset.
func (c *AssetContract) MintAsset(
	ctx contractapi.TransactionContextInterface,
	id string,
	name string,
	classification string,
	ownerDID string,
	metadataHash string,
) error {

	id = strings.TrimSpace(id)
	name = strings.TrimSpace(name)
	classification = strings.TrimSpace(classification)
	ownerDID = strings.TrimSpace(ownerDID)
	metadataHash = strings.TrimSpace(metadataHash)

	if id == "" {
		return fmt.Errorf("asset ID cannot be empty")
	}

	if name == "" {
		return fmt.Errorf("asset name cannot be empty")
	}

	if ownerDID == "" {
		return fmt.Errorf("owner DID cannot be empty")
	}

	if metadataHash == "" {
		return fmt.Errorf("metadata hash cannot be empty")
	}

	switch classification {
	case "Public", "Confidential", "Restricted":
		// Valid classification.
	default:
		return fmt.Errorf(
			"invalid classification: %s; must be Public, Confidential, or Restricted",
			classification,
		)
	}

	existing, err := ctx.GetStub().GetState(id)
	if err != nil {
		return fmt.Errorf("failed to check existing asset: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("asset %s already exists", id)
	}

	asset := Asset{
		ID:             id,
		Name:           name,
		Classification: classification,
		OwnerDID:       ownerDID,
		MetadataHash:   metadataHash,
	}

	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return fmt.Errorf("failed to serialize asset: %w", err)
	}

	if err := ctx.GetStub().PutState(id, assetJSON); err != nil {
		return fmt.Errorf("failed to store asset: %w", err)
	}

	return nil
}

// GetAsset retrieves an asset by ID.
func (c *AssetContract) GetAsset(
	ctx contractapi.TransactionContextInterface,
	id string,
) (string, error) {

	id = strings.TrimSpace(id)

	if id == "" {
		return "", fmt.Errorf("asset ID cannot be empty")
	}

	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return "", fmt.Errorf("failed to read asset: %w", err)
	}

	if assetJSON == nil {
		return "", fmt.Errorf("asset %s does not exist", id)
	}

	return string(assetJSON), nil
}

// TransferAsset transfers ownership of an asset.
func (c *AssetContract) TransferAsset(
	ctx contractapi.TransactionContextInterface,
	id string,
	newOwnerDID string,
) error {

	id = strings.TrimSpace(id)
	newOwnerDID = strings.TrimSpace(newOwnerDID)

	if id == "" {
		return fmt.Errorf("asset ID cannot be empty")
	}

	if newOwnerDID == "" {
		return fmt.Errorf("new owner DID cannot be empty")
	}

	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return fmt.Errorf("failed to read asset: %w", err)
	}

	if assetJSON == nil {
		return fmt.Errorf("asset %s does not exist", id)
	}

	var asset Asset

	if err := json.Unmarshal(assetJSON, &asset); err != nil {
		return fmt.Errorf("failed to deserialize asset: %w", err)
	}

	asset.OwnerDID = newOwnerDID

	updatedAssetJSON, err := json.Marshal(asset)
	if err != nil {
		return fmt.Errorf("failed to serialize updated asset: %w", err)
	}

	if err := ctx.GetStub().PutState(id, updatedAssetJSON); err != nil {
		return fmt.Errorf("failed to update asset: %w", err)
	}

	return nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&AssetContract{})
	if err != nil {
		panic(err)
	}

	chaincodeID := os.Getenv("CHAINCODE_ID")
	address := os.Getenv("CHAINCODE_SERVER_ADDRESS")

	if chaincodeID == "" {
		chaincodeID = "asset"
	}

	if address == "" {
		address = "0.0.0.0:9999"
	}

	server := &shim.ChaincodeServer{
		Chaincode: chaincode,
		CCID:      chaincodeID,
		Address:   address,
		TLSProps: shim.TLSProperties{
			Disabled: true,
		},
	}

	if err := server.Start(); err != nil {
		panic(err)
	}
}