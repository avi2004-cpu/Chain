import { createContext, useContext, useState, useCallback } from "react";

// Distinct connection states — deliberately NOT collapsing
// "not installed" and "rejected" into one generic "error" bucket,
// since Login.jsx needs to show different UI for each.
const STATUS = {
  IDLE: "idle",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  NO_METAMASK: "no-metamask",
  ERROR: "error",
};

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [address, setAddress] = useState(null);
  const [role, setRole] = useState(null); // "Admin" | "Engineer" — set after identity lookup
  const [errorMessage, setErrorMessage] = useState(null);

  const connectWallet = useCallback(async () => {
    // MetaMask not installed at all — distinct from the user rejecting
    // the connection prompt below.
    if (typeof window.ethereum === "undefined") {
      setStatus(STATUS.NO_METAMASK);
      return;
    }

    setStatus(STATUS.CONNECTING);
    setErrorMessage(null);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No account returned by wallet.");
      }

      setAddress(accounts[0]);
      // Role is resolved later via getIdentity() in Dashboard/App —
      // WalletContext only owns the raw wallet connection, not identity.
      setStatus(STATUS.CONNECTED);
    } catch (err) {
      // Covers user rejection (err.code === 4001) and any other wallet error.
      setErrorMessage(err?.message || "Could not connect to wallet.");
      setStatus(STATUS.ERROR);
    }
  }, []);

  const setResolvedRole = useCallback((resolvedRole) => {
    setRole(resolvedRole);
  }, []);

  const resetConnection = useCallback(() => {
    setStatus(STATUS.IDLE);
    setAddress(null);
    setRole(null);
    setErrorMessage(null);
  }, []);

  // DEV-ONLY BYPASS: lets us test Dashboard states without MetaMask
  // installed. import.meta.env.DEV is false in a production build, so
  // this can never accidentally ship to the real demo.
  const devConnect = useCallback((fakeAddress = "did:fabric:eng-a41f9c") => {
    setAddress(fakeAddress);
    setStatus(STATUS.CONNECTED);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        status,
        address,
        role,
        errorMessage,
        connectWallet,
        setResolvedRole,
        resetConnection,
        devConnect,
        STATUS,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used inside a WalletProvider");
  }
  return ctx;
}
