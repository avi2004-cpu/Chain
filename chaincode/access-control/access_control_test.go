package main

import (
	"encoding/json"
	"testing"
)

func TestValidateAccessDecision(t *testing.T) {
	tests := []struct {
		name         string
		assetID      string
		requesterDID string
		riskScore    int
		wantErr      bool
	}{
		{
			name:         "valid request",
			assetID:      "BEL-DRONE-001",
			requesterDID: "DID-USER-001",
			riskScore:    50,
			wantErr:      false,
		},
		{
			name:         "empty asset ID",
			assetID:      "",
			requesterDID: "DID-USER-001",
			riskScore:    50,
			wantErr:      true,
		},
		{
			name:         "empty requester DID",
			assetID:      "BEL-DRONE-001",
			requesterDID: "",
			riskScore:    50,
			wantErr:      true,
		},
		{
			name:         "negative risk score",
			assetID:      "BEL-DRONE-001",
			requesterDID: "DID-USER-001",
			riskScore:    -1,
			wantErr:      true,
		},
		{
			name:         "risk score above 100",
			assetID:      "BEL-DRONE-001",
			requesterDID: "DID-USER-001",
			riskScore:    101,
			wantErr:      true,
		},
		{
			name:         "risk score zero",
			assetID:      "BEL-DRONE-001",
			requesterDID: "DID-USER-001",
			riskScore:    0,
			wantErr:      false,
		},
		{
			name:         "risk score 100",
			assetID:      "BEL-DRONE-001",
			requesterDID: "DID-USER-001",
			riskScore:    100,
			wantErr:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateAccessDecision(
				tt.assetID,
				tt.requesterDID,
				tt.riskScore,
			)

			if (err != nil) != tt.wantErr {
				t.Errorf(
					"validateAccessDecision() error = %v, wantErr = %v",
					err,
					tt.wantErr,
				)
			}
		})
	}
}
func TestAccessLogSerialization(t *testing.T) {
	log := AccessLog{
		Index:        0,
		AssetID:      "BEL-DRONE-001",
		RequesterDID: "DID-USER-001",
		RiskScore:    72,
		Allowed:      true,
		Timestamp:    "2026-09-20T17:45:08Z",
	}

	data, err := json.Marshal(log)
	if err != nil {
		t.Fatalf("failed to marshal AccessLog: %v", err)
	}

	var decoded AccessLog

	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("failed to unmarshal AccessLog: %v", err)
	}

	if decoded.Index != log.Index {
		t.Errorf("Index = %d, want %d", decoded.Index, log.Index)
	}

	if decoded.AssetID != log.AssetID {
		t.Errorf("AssetID = %s, want %s", decoded.AssetID, log.AssetID)
	}

	if decoded.RequesterDID != log.RequesterDID {
		t.Errorf(
			"RequesterDID = %s, want %s",
			decoded.RequesterDID,
			log.RequesterDID,
		)
	}

	if decoded.RiskScore != log.RiskScore {
		t.Errorf(
			"RiskScore = %d, want %d",
			decoded.RiskScore,
			log.RiskScore,
		)
	}

	if decoded.Allowed != log.Allowed {
		t.Errorf(
			"Allowed = %v, want %v",
			decoded.Allowed,
			log.Allowed,
		)
	}

	if decoded.Timestamp != log.Timestamp {
		t.Errorf(
			"Timestamp = %s, want %s",
			decoded.Timestamp,
			log.Timestamp,
		)
	}
}
