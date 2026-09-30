/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from "react";
import { computeRisk } from "../services/mockApi.js";

// Shared state across AssetRequest -> RiskDecision: the asset the user is
// requesting, the zero-trust telemetry inputs, the computed decision, and
// a lightweight toast. Both pages must import this from the SAME path
// (src/context/AccessRequestContext.jsx) — importing two different
// relative paths would silently create two separate contexts that don't
// share state.
const AccessRequestContext = createContext(null);

const DEFAULT_TELEMETRY = {
  location: "BEL Bangalore Secure Intranet (10.240.12.8)",
  deviceStatus: "Hardware Key Attached (FIDO2 Level-3)",
  accessTime: "Regular Operational Shift",
  purpose: "Standard access request",
};

export function AccessRequestProvider({ children }) {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [contextTelemetry, setContextTelemetry] = useState(DEFAULT_TELEMETRY);
  const [activeDecision, setActiveDecision] = useState(null);
  const [isComputing, setIsComputing] = useState(false);
  const [decisionError, setDecisionError] = useState(null); // string | null - evaluation failed
  const [commitResult, setCommitResult] = useState(null); // { txHash, action, ... } once committed to Fabric
  const evalSeq = useRef(0); // guards against a slow earlier response overwriting a newer one

  const [toast, setToast] = useState(null); // { message, type, show }
  const hideTimer = useRef(null);
  const clearTimer = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(hideTimer.current);
    clearTimeout(clearTimer.current);
    setToast({ message, type, show: false });
    // Flip to `show` a tick after mount so the CSS transition animates in,
    // rather than just popping in at full opacity.
    requestAnimationFrame(() => setToast((t) => (t ? { ...t, show: true } : t)));
    hideTimer.current = setTimeout(() => {
      setToast((t) => (t ? { ...t, show: false } : t));
      clearTimer.current = setTimeout(() => setToast(null), 250);
    }, 2400);
  }, []);

  // One code path for "evaluate this asset" (used by AssetRequest and by Retry).
  // Clears any previous decision first so a stale result can never be shown for a
  // new request, and never substitutes a default outcome on failure.
  const runEvaluation = useCallback(async ({ asset, telemetry, requesterDID, requesterAddress }) => {
    const token = ++evalSeq.current;
    setSelectedAsset(asset);
    setActiveDecision(null);
    setDecisionError(null);
    setCommitResult(null);
    setIsComputing(true);
    try {
      const decision = await computeRisk({
        asset,
        location: telemetry.location,
        deviceStatus: telemetry.deviceStatus,
        accessTime: telemetry.accessTime,
        requesterDID,
        requesterAddress,
      });
      if (token === evalSeq.current) setActiveDecision(decision);
    } catch (err) {
      if (token === evalSeq.current) setDecisionError(err?.message || "Risk evaluation failed.");
    } finally {
      if (token === evalSeq.current) setIsComputing(false);
    }
  }, []);

  return (
    <AccessRequestContext.Provider
      value={{
        selectedAsset,
        setSelectedAsset,
        contextTelemetry,
        setContextTelemetry,
        activeDecision,
        setActiveDecision,
        isComputing,
        setIsComputing,
        decisionError,
        commitResult,
        setCommitResult,
        runEvaluation,
        showToast,
      }}
    >
      {children}
      {toast && (
        <div className={`toast glass-floating toast-${toast.type} ${toast.show ? "show" : ""}`}>
          {toast.message}
        </div>
      )}
    </AccessRequestContext.Provider>
  );
}

export function useAccessRequest() {
  const ctx = useContext(AccessRequestContext);
  if (!ctx) {
    throw new Error("useAccessRequest must be used inside an AccessRequestProvider");
  }
  return ctx;
}
