import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../../context/WalletContext.jsx";
import { getIdentity, getDashboardData } from "../../services/mockApi.js";

const VIEW = {
  LOADING: "loading",
  EMPTY: "empty",
  ERROR: "error",
  READY: "ready",
};

export default function Dashboard() {
  const { address, role, setResolvedRole } = useWallet();
  const [view, setView] = useState(VIEW.LOADING);
  const [data, setData] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const load = useCallback(async () => {
    setView(VIEW.LOADING);
    setErrorMessage(null);
    try {
      const idResult = await getIdentity(address);
      setIdentity(idResult);
      setResolvedRole(idResult.role);

      const dashResult = await getDashboardData(idResult.did);
      setData(dashResult);

      setView(dashResult.assets.length === 0 ? VIEW.EMPTY : VIEW.READY);
    } catch (err) {
      setErrorMessage(err?.message || "Failed to load dashboard.");
      setView(VIEW.ERROR);
    }
  }, [address, setResolvedRole]);

  useEffect(() => {
    load();
  }, [load]);

  const effectiveRole = identity?.role || role;

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand-row">
          <div className="brand-mark" />
          <span className="brand-name">DecentraVault</span>
        </div>
        <nav className="nav-group">
          <div className="nav-item active">Dashboard</div>
          <div className="nav-item disabled">
            Asset Request <span className="soon-tag">Soon</span>
          </div>
          <div className="nav-item disabled">
            Risk Decision <span className="soon-tag">Soon</span>
          </div>
          <div className="nav-item disabled">
            Audit Log <span className="soon-tag">Soon</span>
          </div>
        </nav>
      </aside>

      <main className="main">
        <div className="page-head">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-desc">
              {effectiveRole
                ? `Signed in as ${effectiveRole}`
                : "Loading your identity…"}
            </p>
          </div>
          <span className="env-pill">Mock data</span>
        </div>

        {view === VIEW.LOADING && (
          <div className="panel">
            {[1, 2, 3].map((n) => (
              <div className="skeleton-row" key={n}>
                <div className="skeleton-bar" style={{ width: "60%", marginBottom: 8 }} />
                <div className="skeleton-bar" style={{ width: "35%" }} />
              </div>
            ))}
          </div>
        )}

        {view === VIEW.ERROR && (
          <div className="panel error-state">
            <div className="error-title">Couldn&apos;t load your dashboard</div>
            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-dim)" }}>
              {errorMessage}
            </p>
            <button type="button" onClick={load}>
              Retry
            </button>
          </div>
        )}

        {view === VIEW.EMPTY && (
          <div className="panel empty-state">
            <div className="empty-title">No assets yet</div>
            <p style={{ margin: 0 }}>
              You don&apos;t own any assets right now. Once you&apos;re granted
              access to something, it&apos;ll show up here.
            </p>
            <button type="button" onClick={load}>
              Refresh
            </button>
          </div>
        )}

        {view === VIEW.READY && data && (
          <>
            <div className="metrics-row">
              <div className="metric-card">
                <div className="metric-label">
                  <span className="metric-dot" style={{ background: "var(--accent)" }} />
                  Owned Assets
                </div>
                <div className="metric-value">{data.assets.length}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">
                  <span className="metric-dot" style={{ background: "var(--stepup)" }} />
                  Pending Requests
                </div>
                <div className="metric-value">{data.pendingRequests.length}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">
                  <span className="metric-dot" style={{ background: "var(--allow)" }} />
                  Role
                </div>
                <div className="metric-value" style={{ fontSize: 14 }}>
                  {effectiveRole}
                </div>
              </div>
              {effectiveRole === "Admin" && (
                <div className="metric-card">
                  <div className="metric-label">
                    <span className="metric-dot" style={{ background: "var(--block)" }} />
                    Admin: Org Approvals
                  </div>
                  <div className="metric-value" style={{ fontSize: 14 }}>
                    View
                  </div>
                </div>
              )}
            </div>

            <div className="panel">
              {data.assets.map((asset) => (
                <div
                  key={asset.id}
                  className="skeleton-row"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{asset.name}</div>
                    <span className="mono">{asset.id}</span>
                  </div>
                  <span className="class-tag">{asset.classification}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
