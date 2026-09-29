package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/hyperledger/fabric-chaincode-go/v2/shim"
	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
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

var validClassifications = map[string]bool{
	"Public":       true,
	"Internal":     true,
	"Confidential": true,
	"Restricted":   true,
}

func (c *AssetContract) MintAsset(ctx contractapi.TransactionContextInterface, id string, name string, classification string, ownerDID string, metadataHash string) error {
	id = strings.TrimSpace(id)
	name = strings.TrimSpace(name)
	ownerDID = strings.TrimSpace(ownerDID)
	metadataHash = strings.TrimSpace(metadataHash)

	if id == "" {
		return fmt.Errorf("asset id cannot be empty")
	}
	if name == "" {
		return fmt.Errorf("asset name cannot be empty")
	}
	if ownerDID == "" {
		return fmt.Errorf("ownerDID cannot be empty")
	}
	if metadataHash == "" {
		return fmt.Errorf("metadataHash cannot be empty")
	}
	if !validClassifications[classification] {
		return fmt.Errorf("invalid classification: %s (must be Public, Internal, Confidential, or Restricted)", classification)
	}

	existing, err := ctx.GetStub().GetState(id)
	if err != nil {
		return fmt.Errorf("failed to read ledger state: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("asset %s already exists", id)
	}

	asset := Asset{ID: id, Name: name, Classification: classification, OwnerDID: ownerDID, MetadataHash: metadataHash}
	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return fmt.Errorf("failed to marshal asset: %v", err)
	}

	return ctx.GetStub().PutState(id, assetJSON)
}

func (c *AssetContract) GetAsset(ctx contractapi.TransactionContextInterface, id string) (string, error) {
	if id == "" {
		return "", fmt.Errorf("asset id cannot be empty")
	}
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return "", fmt.Errorf("failed to read ledger state: %v", err)
	}
	if assetJSON == nil {
		return "", fmt.Errorf("asset %s does not exist", id)
	}
	return string(assetJSON), nil
}

func (c *AssetContract) TransferAsset(ctx contractapi.TransactionContextInterface, id string, newOwnerDID string) error {
	newOwnerDID = strings.TrimSpace(newOwnerDID)
	if id == "" {
		return fmt.Errorf("asset id cannot be empty")
	}
	if newOwnerDID == "" {
		return fmt.Errorf("newOwnerDID cannot be empty")
	}

	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return fmt.Errorf("failed to read ledger state: %v", err)
	}
	if assetJSON == nil {
		return fmt.Errorf("asset %s does not exist", id)
	}

	var asset Asset
	if err := json.Unmarshal(assetJSON, &asset); err != nil {
		return fmt.Errorf("failed to unmarshal asset: %v", err)
	}
	asset.OwnerDID = newOwnerDID

	updatedJSON, err := json.Marshal(asset)
	if err != nil {
		return fmt.Errorf("failed to marshal updated asset: %v", err)
	}
	return ctx.GetStub().PutState(id, updatedJSON)
}

// GetAllAssets — new: powers the frontend's browse/search and dashboard
// ownership views. A full range scan is safe here since this chaincode
// never stores any key type other than assets.
func (c *AssetContract) GetAllAssets(ctx contractapi.TransactionContextInterface) (string, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return "", fmt.Errorf("failed to get state by range: %v", err)
	}
	defer resultsIterator.Close()

	var assets []Asset
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return "", fmt.Errorf("failed to iterate results: %v", err)
		}
		var asset Asset
		if err := json.Unmarshal(queryResponse.Value, &asset); err != nil {
			continue // skip any non-asset key, defensively
		}
		assets = append(assets, asset)
	}

	if assets == nil {
		assets = []Asset{}
	}
	assetsJSON, err := json.Marshal(assets)
	if err != nil {
		return "", fmt.Errorf("failed to marshal assets: %v", err)
	}
	return string(assetsJSON), nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&AssetContract{})
	if err != nil {
		panic(fmt.Sprintf("Error creating asset chaincode: %v", err))
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
		panic(fmt.Sprintf("Error starting asset chaincode server: %v", err))
	}
}