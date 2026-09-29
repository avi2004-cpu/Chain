/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminOverview, getIdentities } from "../../services/mockApi.js";
import "../../styles/admin.css";

// Ported from the standalone admin.html mock. Same layout, but every number
// now comes from the ledger through the backend.

const CLASSES = ["Restricted", "Confidential", "Internal", "Public"];
const OUTCOME_COLOR = { Allow: "var(--allow)", "Step-Up": "var(--stepup)", Block: "var(--block)" };

// The ledger stores only `allowed`. Not allowed + high score => Block,
// otherwise Step-Up (an unregistered requester with a low score is also
// stored as allowed=false and will show as Step-Up here).
function outcomeOf(log) {
  if (log.allowed) return "Allow";
  return log.riskScore >= 70 ? "Block" : "Step-Up";
}

function bucketByHour(logs) {
  const HOUR = 3600 * 1000;
  const now = Date.now();
  const buckets = Array.from({ length: 12 }, () => ({ Allow: 0, "Step-Up": 0, Block: 0 }));
  for (const l of logs) {
    const age = now - Date.parse(l.timestamp);
    if (!(age >= 0) || age >= 12 * HOUR) continue;
    buckets[11 - Math.floor(age / HOUR)][outcomeOf(l)] += 1;
  }
  return buckets;
}

function fmtTime(ts) {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function DecisionChart({ logs }) {
  const buckets = useMemo(() => bucketByHour(logs), [logs]);
  const max = Math.max(1, ...buckets.map((b) => b.Allow + b["Step-Up"] + b.Block));
  return (
    <>
      <svg viewBox="0 0 360 120" width="100%" role="img" aria-label="Access decisions in the last 12 hours">
        {buckets.map((b, i) => {
          let y = 115;
          return ["Allow", "Step-Up", "Block"].map((k) => {
            const h = (b[k] / max) * 105;
            y -= h;
            return h > 0 ? (
              <rect key={`${i}-${k}`} x={8 + i * 29} y={y} width="22" height={h} rx="2" fill={OUTCOME_COLOR[k]} />
            ) : null;
          });
        })}
      </svg>
      <div className="legend">
        {Object.entries(OUTCOME_COLOR).map(([k, c]) => (
          <span key={k}><i style={{ background: c }} />{k}</span>
        ))}
      </div>
    </>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await getAdminOverview());
    } catch (err) {
      setError(err?.message || "Failed to load admin overview.");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="panel empty-state">
        <div className="empty-title">Could not load admin data</div>
        <p className="empty-copy">{error}</p>
        <button className="btn-primary" onClick={load}>Retry</button>
      </div>
    );
  }
  if (!data) return <div className="panel"><div className="admin-note">Loading from ledger…</div></div>;

  const { assets, logs, pendingEndorsements } = data;
  const counts = Object.fromEntries(CLASSES.map((c) => [c, assets.filter((a) => a.classification === c).length]));
  const maxCount = Math.max(1, ...Object.values(counts));
  const notAllowed = logs.filter((l) => !l.allowed).length;

  return (
    <>
      <div className="metrics-row">
        <div className="metric-card"><div className="metric-label"><span className="metric-dot" style={{ background: "var(--tier-info)" }} />Assets</div><div className="metric-value">{assets.length}</div></div>
        <div className="metric-card"><div className="metric-label"><span className="metric-dot" style={{ background: "var(--accent)" }} />Decisions logged</div><div className="metric-value">{logs.length}</div></div>
        <div className="metric-card"><div className="metric-label"><span className="metric-dot" style={{ background: "var(--block)" }} />Not allowed</div><div className="metric-value">{notAllowed}</div></div>
        <div className="metric-card"><div className="metric-label"><span className="metric-dot" style={{ background: "var(--stepup)" }} />Pending endorsements (demo)</div><div className="metric-value">{pendingEndorsements}</div></div>
      </div>

      <div className="two">
        <div className="panel">
          <div className="panel-h">Assets by classification</div>
          <div className="panel-b">
            {CLASSES.map((k) => (
              <div className="bar" key={k}>
                <span className="k">{k}</span>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${(counts[k] / maxCount) * 100}%`, background: "var(--accent)" }} />
                </div>
                <span className="v">{counts[k]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-h">Access decisions · last 12h</div>
          <div className="panel-b"><DecisionChart logs={logs} /></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">Recent access decisions · from ledger</div>
        <div className="scroll">
          <div className="lrow head">
            <span>Time</span><span>Asset</span><span>Requester</span><span>Class</span><span>Risk</span><span>Outcome</span><span>Tx</span>
          </div>
          {logs.length === 0 && <div className="admin-note">No decisions logged yet.</div>}
          {logs.slice(0, 25).map((l) => {
            const o = outcomeOf(l);
            return (
              <div className={`lrow o-${o}`} key={l.txId}>
                <span className="mono">{fmtTime(l.timestamp)}</span>
                <span className="asset-cell">{l.assetId}</span>
                <span className="mono">{l.requesterDid}</span>
                <span className="class-tag">{l.classification}</span>
                <span className="mono">{l.riskScore}</span>
                <span className={`badge ${o}`}>{o}</span>
                <span className="mono" title={l.txId}>{(l.txId || "").slice(0, 12)}…</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Identities() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows(await getIdentities());
    } catch (err) {
      setError(err?.message || "Failed to load identities.");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="panel empty-state">
        <div className="empty-title">Identity directory unavailable</div>
        <p className="empty-copy">
          {error}. This view needs the identity chaincode upgraded with <span className="mono">GetAllIdentities</span> (see docs/admin-console.md).
        </p>
        <button className="btn-primary" onClick={load}>Retry</button>
      </div>
    );
  }
  if (!rows) return <div className="panel"><div className="admin-note">Loading from ledger…</div></div>;

  const roles = [...new Set(rows.map((r) => r.role))].sort();
  const needle = q.trim().toLowerCase();
  const filtered = rows.filter(
    (r) => (!role || r.role === role) && (!needle || `${r.did} ${r.role} ${r.address}`.toLowerCase().includes(needle))
  );

  return (
    <>
      <div className="tele" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="field search-field"><label>Search</label>
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="DID, role or address" />
        </div>
        <div className="field"><label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div className="panel">
        <div className="scroll">
          <div className="irow head"><span>DID</span><span>Role</span><span>Address</span></div>
          {filtered.map((r) => (
            <div className="irow" key={r.address}>
              <span className="asset-cell" style={{ color: "var(--text)" }}>{r.did}</span>
              <span>{r.role}</span>
              <span className="mono" title={r.address}>{r.address.length > 16 ? `${r.address.slice(0, 8)}…${r.address.slice(-6)}` : r.address}</span>
            </div>
          ))}
        </div>
        <div className="foot">{filtered.length} of {rows.length} identities</div>
      </div>
    </>
  );
}

export default function Admin() {
  const [tab, setTab] = useState("overview");
  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Admin Console</h1>
          <p className="page-desc">Monitoring assets, identities and access decisions recorded on the Fabric ledger.</p>
        </div>
        <span className="env-pill">Live · Fabric</span>
      </div>
      <div className="admin-tabs">
        <button className={tab === "overview" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("overview")}>Overview</button>
        <button className={tab === "identities" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("identities")}>Identities</button>
      </div>
      {tab === "overview" ? <Overview /> : <Identities />}
    </main>
  );
}
