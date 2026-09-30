package main

import (
	"encoding/json"
	"fmt"
	"sort"
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/v2/shim"
	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
	"github.com/hyperledger/fabric-protos-go-apiv2/ledger/queryresult"
)

type assetTestStub struct {
	shim.ChaincodeStubInterface
	state map[string][]byte
}

func (stub *assetTestStub) GetState(key string) ([]byte, error) {
	return stub.state[key], nil
}

func (stub *assetTestStub) PutState(key string, value []byte) error {
	stub.state[key] = append([]byte(nil), value...)
	return nil
}

func (stub *assetTestStub) GetStateByRange(startKey, endKey string) (shim.StateQueryIteratorInterface, error) {
	keys := make([]string, 0, len(stub.state))
	for key := range stub.state {
		if (startKey == "" || key >= startKey) && (endKey == "" || key < endKey) {
			keys = append(keys, key)
		}
	}
	sort.Strings(keys)

	entries := make([]*queryresult.KV, 0, len(keys))
	for _, key := range keys {
		entries = append(entries, &queryresult.KV{Key: key, Value: stub.state[key]})
	}
	return &assetTestIterator{entries: entries}, nil
}

type assetTestIterator struct {
	shim.StateQueryIteratorInterface
	entries []*queryresult.KV
	index   int
}

func (iterator *assetTestIterator) HasNext() bool {
	return iterator.index < len(iterator.entries)
}

func (iterator *assetTestIterator) Next() (*queryresult.KV, error) {
	if !iterator.HasNext() {
		return nil, fmt.Errorf("no query results remain")
	}
	entry := iterator.entries[iterator.index]
	iterator.index++
	return entry, nil
}

func (iterator *assetTestIterator) Close() error {
	return nil
}

func TestAssetContractTransactionsRegister(t *testing.T) {
	if _, err := contractapi.NewChaincode(&AssetContract{}); err != nil {
		t.Fatalf("failed to register asset contract transactions: %v", err)
	}
}

func TestAssetMetadataSerializationAndLegacyCompatibility(t *testing.T) {
	size := int64(0)
	asset := Asset{
		ID:             "CG-HIGH-RISK-001",
		Name:           "Radar Blueprint",
		Classification: "Restricted",
		OwnerDID:       "did:example:owner",
		MetadataHash:   "sha256-value",
		Organization:   "BEL",
		Format:         "application/pdf",
		Size:           &size,
		Description:    "Verified description",
	}

	encoded, err := json.Marshal(asset)
	if err != nil {
		t.Fatalf("failed to serialize asset: %v", err)
	}

	var decoded Asset
	if err := json.Unmarshal(encoded, &decoded); err != nil {
		t.Fatalf("failed to deserialize asset: %v", err)
	}
	if decoded.Organization != asset.Organization || decoded.Format != asset.Format ||
		decoded.Size == nil || *decoded.Size != *asset.Size || decoded.Description != asset.Description ||
		decoded.MetadataHash != asset.MetadataHash {
		t.Fatalf("asset metadata did not round-trip: %+v", decoded)
	}

	legacyJSON := []byte(`{"id":"LEGACY-001","name":"Legacy asset","classification":"Public","ownerDID":"did:example:owner","metadataHash":"legacy-hash"}`)
	var legacy Asset
	if err := json.Unmarshal(legacyJSON, &legacy); err != nil {
		t.Fatalf("failed to read legacy asset: %v", err)
	}
	if legacy.ID != "LEGACY-001" || legacy.MetadataHash != "legacy-hash" ||
		legacy.Organization != "" || legacy.Format != "" || legacy.Size != nil || legacy.Description != "" {
		t.Fatalf("legacy asset was not read with empty optional metadata: %+v", legacy)
	}
}

func TestAssetMetadataLedgerFlowAndLegacyBackfill(t *testing.T) {
	stub := &assetTestStub{state: make(map[string][]byte)}
	ctx := &contractapi.TransactionContext{}
	ctx.SetStub(stub)
	contract := &AssetContract{}

	metadataJSON := `{"organization":"Test Organization","format":"application/pdf","size":1048576,"description":"Test asset description"}`
	if err := contract.MintAssetWithMetadata(ctx, "TEST-ASSET-001", "Test Asset", "Restricted", "did:example:owner", "test-sha256", metadataJSON); err != nil {
		t.Fatalf("failed to mint asset with metadata: %v", err)
	}

	assetJSON, err := contract.GetAsset(ctx, "TEST-ASSET-001")
	if err != nil {
		t.Fatalf("failed to retrieve minted asset: %v", err)
	}
	var asset Asset
	if err := json.Unmarshal([]byte(assetJSON), &asset); err != nil {
		t.Fatalf("failed to decode retrieved asset: %v", err)
	}
	if asset.Organization != "Test Organization" || asset.Format != "application/pdf" || asset.Size == nil ||
		*asset.Size != 1048576 || asset.Description != "Test asset description" || asset.MetadataHash != "test-sha256" {
		t.Fatalf("retrieved metadata did not match minted metadata: %+v", asset)
	}

	assetsJSON, err := contract.GetAllAssets(ctx)
	if err != nil {
		t.Fatalf("failed to list assets: %v", err)
	}
	var assets []Asset
	if err := json.Unmarshal([]byte(assetsJSON), &assets); err != nil {
		t.Fatalf("failed to decode asset list: %v", err)
	}
	if len(assets) != 1 || assets[0].ID != "TEST-ASSET-001" || assets[0].Organization != "Test Organization" {
		t.Fatalf("asset list did not include stored metadata: %+v", assets)
	}

	if err := contract.TransferAsset(ctx, "TEST-ASSET-001", "did:example:new-owner"); err != nil {
		t.Fatalf("failed to transfer asset: %v", err)
	}
	assetJSON, err = contract.GetAsset(ctx, "TEST-ASSET-001")
	if err != nil {
		t.Fatalf("failed to retrieve transferred asset: %v", err)
	}
	if err := json.Unmarshal([]byte(assetJSON), &asset); err != nil {
		t.Fatalf("failed to decode transferred asset: %v", err)
	}
	if asset.OwnerDID != "did:example:new-owner" || asset.Organization != "Test Organization" || asset.Size == nil || *asset.Size != 1048576 {
		t.Fatalf("transfer did not preserve asset metadata: %+v", asset)
	}

	if err := contract.MintAsset(ctx, "LEGACY-001", "Legacy Asset", "Public", "did:example:legacy-owner", "legacy-sha256"); err != nil {
		t.Fatalf("legacy mint transaction failed: %v", err)
	}
	if err := contract.UpdateAssetMetadata(ctx, "LEGACY-001", `{"organization":"Verified Org","size":0}`); err != nil {
		t.Fatalf("failed to backfill legacy asset metadata: %v", err)
	}
	assetJSON, err = contract.GetAsset(ctx, "LEGACY-001")
	if err != nil {
		t.Fatalf("failed to retrieve backfilled asset: %v", err)
	}
	if err := json.Unmarshal([]byte(assetJSON), &asset); err != nil {
		t.Fatalf("failed to decode backfilled asset: %v", err)
	}
	if asset.OwnerDID != "did:example:legacy-owner" || asset.Classification != "Public" ||
		asset.MetadataHash != "legacy-sha256" || asset.Organization != "Verified Org" || asset.Size == nil || *asset.Size != 0 {
		t.Fatalf("legacy backfill did not preserve existing fields or zero size: %+v", asset)
	}
}
