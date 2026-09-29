/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from "react";

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
