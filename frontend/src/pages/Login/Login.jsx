import { useWallet } from "../../context/WalletContext.jsx";

export default function Login({ onConnected }) {
   const { status, connectWallet, devConnect, errorMessage, STATUS } = useWallet();
  const handleConnect = async () => {
    await connectWallet();
  };

  // Fires the parent callback once we're actually connected.
  // (Kept simple/explicit rather than a useEffect, since App.jsx
  // re-renders Login while status is anything other than CONNECTED.)
  if (status === STATUS.CONNECTED && onConnected) {
    onConnected();
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand-row">
          <div className="brand-mark" />
          <span className="brand-name">DecentraVault</span>
        </div>

        <h1 className="login-title">Sign in with your wallet</h1>
        <p className="login-desc">
          ChainGuard uses your wallet identity to verify who you are and
          what you&apos;re allowed to access.
        </p>

        {status === STATUS.NO_METAMASK && (
          <div className="empty-state" style={{ padding: "16px 0 20px" }}>
            <div className="empty-title">MetaMask isn&apos;t installed</div>
            <p style={{ margin: 0, fontSize: "12.5px" }}>
              You&apos;ll need the MetaMask browser extension to sign in.
            </p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
            >
              <button type="button">Install MetaMask</button>
            </a>
          </div>
        )}

        {status === STATUS.ERROR && (
          <div className="error-state" style={{ padding: "16px 0 20px" }}>
            <div className="error-title">Connection failed</div>
            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-dim)" }}>
              {errorMessage || "Something went wrong connecting your wallet."}
            </p>
            <button type="button" onClick={handleConnect}>
              Retry
            </button>
          </div>
        )}

                {(status === STATUS.IDLE || status === STATUS.CONNECTING) && (
          <button
            type="button"
            className="connect-btn"
            onClick={handleConnect}
            disabled={status === STATUS.CONNECTING}
          >
            {status === STATUS.CONNECTING && <span className="spinner" />}
            {status === STATUS.CONNECTING ? "Connecting…" : "Connect Wallet"}
          </button>
        )}

        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={() => devConnect()}
            style={{
              marginTop: 10,
              width: "100%",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-dim)",
              background: "transparent",
              border: "1px dashed var(--border-strong)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Skip login (dev only)
          </button>
        )}
      </div>
    </div>
  );
}