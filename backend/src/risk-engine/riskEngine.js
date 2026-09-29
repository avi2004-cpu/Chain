// ChainGuard Risk Engine
// Owner: Jeswin
//
// Responsibility:
// - Calculate a 0-100 risk score from identity/asset/context information.
// - Produce the access decision.
// - Return data that the backend can pass to Access-Control chaincode.
//
// The Risk Engine does NOT directly call Fabric chaincodes.
// Identity and Asset information are supplied by the backend/Gateway layer.
// The resulting decision is logged by Access-Control chaincode.

const DEVICE_RISK = {
  "Hardware Key Attached (FIDO2 Level-3)": 2,
  "Partial Compliance (TPM 2.0)": 5,
  "Unmanaged Device": 9,
};

const LOCATION_RISK = {
  "BEL Bangalore Secure Intranet (10.240.12.8)": 1,
  "Field Operational Unit (Tactical WAN)": 5,
  "External / Off-Premises": 9,
};

const TIME_RISK = {
  "Regular Operational Shift": 2,
  "Off-Hours (22:00 - 05:00)": 8,
};

const CLASSIFICATION_RISK = {
  Public: 1,
  Internal: 3,
  Confidential: 6,
  Restricted: 9,
};

// Risk factor weights.
// The total is exactly 100%.
const WEIGHTS = {
  deviceTrust: 25,
  locationAnomaly: 20,
  timeOfAccess: 15,
  assetClassification: 25,
  sessionBehavior: 15,
};

const THRESHOLDS = {
  stepUp: 40,
  block: 70,
};

/**
 * Calculate the risk score for an access request.
 *
 * The function supports the current backend request format:
 *
 * {
 *   classification,
 *   anomalyDevice,
 *   anomalyLocation,
 *   anomalyTime,
 *   requiresMultiSig
 * }
 *
 * It also accepts optional identity/asset objects so the backend
 * can later supply data obtained from the Identity and Asset
 * chaincodes without changing this module.
 */
export function computeRisk(params = {}) {
  const {
    // Current backend fields
    classification,
    anomalyDevice = false,
    anomalyLocation = false,
    anomalyTime = false,
    requiresMultiSig = false,

    // Optional Identity-chaincode information
    identity = {},

    // Optional Asset-chaincode information
    asset = {},

    // Optional context fields
    deviceStatus,
    location,
    accessTime,
  } = params;

  // ------------------------------------------------------------
  // Identity information
  // ------------------------------------------------------------
  const identityRegistered =
    identity.registered === undefined ? true : Boolean(identity.registered);

  const role = identity.role || null;

  // An unregistered identity is treated as high risk.
  // The actual registration check should come from Identity chaincode.
  const identityRisk = identityRegistered ? 0 : 10;

  // ------------------------------------------------------------
  // Asset information
  // ------------------------------------------------------------
  const assetClassification =
    classification ||
    asset.classification ||
    "Internal";

  const assetOwnerDID = asset.ownerDID || null;

  // ------------------------------------------------------------
  // Device risk
  // ------------------------------------------------------------
  let deviceRisk;

  if (deviceStatus && DEVICE_RISK[deviceStatus] !== undefined) {
    deviceRisk = DEVICE_RISK[deviceStatus];
  } else {
    deviceRisk = anomalyDevice ? 9 : 2;
  }

  // ------------------------------------------------------------
  // Location risk
  // ------------------------------------------------------------
  let locationRisk;

  if (location && LOCATION_RISK[location] !== undefined) {
    locationRisk = LOCATION_RISK[location];
  } else {
    locationRisk = anomalyLocation ? 9 : 1;
  }

  // ------------------------------------------------------------
  // Time risk
  // ------------------------------------------------------------
  let timeRisk;

  if (accessTime && TIME_RISK[accessTime] !== undefined) {
    timeRisk = TIME_RISK[accessTime];
  } else {
    timeRisk = anomalyTime ? 8 : 2;
  }

  // ------------------------------------------------------------
  // Asset classification risk
  // ------------------------------------------------------------
  const assetRisk =
    CLASSIFICATION_RISK[assetClassification] ?? 5;

  // ------------------------------------------------------------
  // Session behavior
  // ------------------------------------------------------------
  // The current project model uses a baseline session risk of 3.
  // Future session telemetry can replace this value.
  let sessionRisk = 3;

  // An unregistered requester should increase overall risk.
  if (!identityRegistered) {
    sessionRisk = 10;
  }

  // ------------------------------------------------------------
  // Weighted calculation
  // ------------------------------------------------------------
  const factors = [
    {
      name: "Device Trust",
      weight: WEIGHTS.deviceTrust,
      riskScore: deviceRisk,
      weighted: (deviceRisk / 10) * WEIGHTS.deviceTrust,
    },
    {
      name: "Location Anomaly",
      weight: WEIGHTS.locationAnomaly,
      riskScore: locationRisk,
      weighted: (locationRisk / 10) * WEIGHTS.locationAnomaly,
    },
    {
      name: "Time-of-Access",
      weight: WEIGHTS.timeOfAccess,
      riskScore: timeRisk,
      weighted: (timeRisk / 10) * WEIGHTS.timeOfAccess,
    },
    {
      name: "Asset Classification",
      weight: WEIGHTS.assetClassification,
      riskScore: assetRisk,
      weighted: (assetRisk / 10) * WEIGHTS.assetClassification,
    },
    {
      name: "Session Behavior",
      weight: WEIGHTS.sessionBehavior,
      riskScore: sessionRisk,
      weighted: (sessionRisk / 10) * WEIGHTS.sessionBehavior,
    },
  ];

  const score = Math.round(
    factors.reduce((total, factor) => total + factor.weighted, 0)
  );

  // ------------------------------------------------------------
  // Decision
  // ------------------------------------------------------------
  let outcome;

  if (!identityRegistered) {
    outcome = "BLOCK";
  } else if (score >= THRESHOLDS.block) {
    outcome = "BLOCK";
  } else if (score >= THRESHOLDS.stepUp) {
    outcome = "STEP_UP";
  } else {
    outcome = "ALLOW";
  }

  // ------------------------------------------------------------
  // Reasons / anomalies
  // ------------------------------------------------------------
  const anomalies = [];

  if (anomalyDevice) {
    anomalies.push("Device anomaly detected");
  }

  if (anomalyLocation) {
    anomalies.push("Location anomaly detected");
  }

  if (anomalyTime) {
    anomalies.push("Off-hours access detected");
  }

  if (!identityRegistered) {
    anomalies.push("Requester identity is not registered");
  }

  if (assetClassification === "Restricted") {
    anomalies.push("Restricted asset requested");
  }

  if (requiresMultiSig) {
    anomalies.push("Multi-organization endorsement required");
  }

  let reason;

  if (outcome === "BLOCK") {
    reason = "Risk score exceeds the permitted access threshold.";
  } else if (outcome === "STEP_UP") {
    reason = "Additional verification is required before access.";
  } else {
    reason = "All risk factors are within acceptable thresholds.";
  }

  return {
    score,
    outcome,
    reason,
    factors,
    thresholds: THRESHOLDS,
    anomalies,

    // Context returned for backend/audit processing.
    identity: {
      registered: identityRegistered,
      role,
    },

    asset: {
      classification: assetClassification,
      ownerDID: assetOwnerDID,
    },

    requiresMultiSig,
  };
}
