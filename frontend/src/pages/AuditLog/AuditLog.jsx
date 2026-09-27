/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from "react";
import { getAccessLogs } from "../../services/mockApi";
import { useAccessRequest } from "../../context/AccessRequestContext";

const EMPTY_FILTERS = { classification: "", outcome: "", from: "", to: "", search: "" };

function fmtShortDate(iso) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}
function fmtDate(iso) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}
function shortHash(h) {
  return h.length > 14 ? h.slice(0, 6) + "…" + h.slice(-4) : h;
}

const SKELETON_WIDTHS = [58, 63, 72, 81, 67];

export default function AuditLog() {
  const { showToast } = useAccessRequest();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [rows, setRows] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const searchDebounce = useRef(null);

  const load = useCallback(async (f) => {
    setRows(null);
    setError(null);
    try {
      const data = await getAccessLogs(f);
      setRows(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to load audit events");
    }
  }, []);

  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.classification, filters.outcome, filters.from, filters.to]);

  const onSearchChange = (value) => {
    setFilters((f) => ({ ...f, search: value }));
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => load({ ...filters, search: value }), 220);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    load(EMPTY_FILTERS);
  };

  const copyHash = (hash) => {
    navigator.clipboard?.writeText(hash).then(() => showToast("Transaction hash copied", "success"));
  };

  const metrics = {
    total: rows ? rows.length : "—",
    allow: rows ? rows.filter((r) => r.outcome === "Allow").length : "—",
    block: rows ? rows.filter((r) => r.outcome === "Block").length : "—",
  };

  return (
    <div className="main-content">
      <div className="page-head">
        <div>
          <h1 className="page-title">Audit &amp; Access Logs</h1>
          <p className="page-desc">Monitor access decisions, authorization events, and organization endorsements.</p>
        </div>
        <div className="status-block">
          <div className="env-pill">
            <span className="env-dot" />
            Development Environment
          </div>
          <div>{lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}` : "Last updated —"}</div>
        </div>
      </div>

      <div className="metrics-row" style={{ marginBottom: 12 }}>
        <div className="metric-card">
          <div className="metric-label"><span className="metric-dot" style={{ background: "var(--accent)" }} />Total Events</div>
          <div className="metric-value">{metrics.total}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><span className="metric-dot" style={{ background: "var(--allow)" }} />Allowed</div>
          <div className="metric-value">{metrics.allow}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><span className="metric-dot" style={{ background: "var(--block)" }} />Blocked</div>
          <div className="metric-value">{metrics.block}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="field search-field">
          <label>Search</label>
          <span className="search-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Requester, asset, or tx hash"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Classification</label>
          <select value={filters.classification} onChange={(e) => setFilters((f) => ({ ...f, classification: e.target.value }))}>
            <option value="">All</option>
            <option>Public</option>
            <option>Internal</option>
            <option>Confidential</option>
            <option>Restricted</option>
          </select>
        </div>
        <div className="field">
          <label>Decision</label>
          <select value={filters.outcome} onChange={(e) => setFilters((f) => ({ ...f, outcome: e.target.value }))}>
            <option value="">All</option>
            <option>Allow</option>
            <option>Step-Up</option>
            <option>Block</option>
            <option>Endorsed</option>
          </select>
        </div>
        <div className="field">
          <label>From</label>
          <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
        </div>
        <div className="field">
          <label>To</label>
          <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
        </div>
        <div className="toolbar-spacer" />
        <button className="clear-btn" onClick={clearFilters}>Clear filters</button>
      </div>

      <div className="panel">
        {rows === null && !error && (
          <>
            {SKELETON_WIDTHS.map((width, index) => (
              <div key={`skeleton-${index}`} className="skeleton-row">
                <div className="skeleton-bar" style={{ width: `${width}%` }} />
              </div>
            ))}
          </>
        )}

        {error && (
          <div className="error-state">
            <div className="error-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="8" x2="12" y2="13" />
                <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div className="error-title">Unable to load audit events</div>
            <p>{error}</p>
            <button onClick={() => load(filters)}>Retry</button>
          </div>
        )}

        {rows && rows.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="14" y2="18" />
                <line x1="17" y1="15" x2="21" y2="19" />
                <line x1="21" y1="15" x2="17" y2="19" />
              </svg>
            </div>
            <div className="empty-title">No matching events</div>
            <p className="empty-copy">No audit events fall within the current filters.</p>
            <button onClick={clearFilters}>Clear filters</button>
          </div>
        )}

        {rows && rows.length > 0 && (
          <>
            <div className="log-row head">
              <div>Timestamp</div><div>Requester</div><div>Asset</div><div>Classification</div><div>Decision</div><div>Transaction</div>
            </div>
            {rows.map((r) => (
              <div key={r.id} className={`log-row outcome-${r.outcome}`} onClick={() => setActiveRow(r)}>
                <div className="mono">{fmtShortDate(r.timestamp)}</div>
                <div className="req-cell">{r.requester}</div>
                <div className="asset-cell">{r.assetId}</div>
                <div><span className="class-tag">{r.classification}</span></div>
                <div><span className={`badge ${r.outcome}`}>{r.outcome}</span></div>
                <div className="tx-cell">
                  <span className="mono">{shortHash(r.txHash)}</span>
                  <button
                    className="tx-copy-btn"
                    title="Copy transaction hash"
                    onClick={(e) => { e.stopPropagation(); copyHash(r.txHash); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="12" height="12" rx="1.5" />
                      <path d="M5 15V5a2 2 0 012-2h10" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {activeRow && (
        <>
          <div className="overlay show" onClick={() => setActiveRow(null)} />
          <div className="drawer glass-floating show">
            <div className="drawer-head">
              <div>
                <div className="drawer-eyebrow">Audit Event</div>
                <div className="drawer-title">{activeRow.id}</div>
              </div>
              <button className="drawer-close" onClick={() => setActiveRow(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="drawer-body">
              <div className="detail-row"><div className="detail-k">Requester</div><div className="detail-v">{activeRow.requester}</div></div>
              <div className="detail-row"><div className="detail-k">Asset</div><div className="detail-v mono">{activeRow.assetId}</div></div>
              <div className="detail-row"><div className="detail-k">Classification</div><div className="detail-v">{activeRow.classification}</div></div>
              <div className="detail-row"><div className="detail-k">Decision</div><div className="detail-v"><span className={`badge ${activeRow.outcome}`}>{activeRow.outcome}</span></div></div>
              <div className="detail-row"><div className="detail-k">Timestamp</div><div className="detail-v mono">{fmtDate(activeRow.timestamp)}</div></div>
              <div className="detail-row"><div className="detail-k">Transaction</div><div className="detail-v mono">{activeRow.txHash}</div></div>
            </div>
            <div className="drawer-foot"><button onClick={() => setActiveRow(null)}>Close</button></div>
          </div>
        </>
      )}
    </div>
  );
}
