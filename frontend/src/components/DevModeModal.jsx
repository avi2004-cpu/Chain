import { useState } from "react";
import { createPortal } from "react-dom";
import { setDevMode } from "../services/mockApi";

// Shared across every page via Sidebar's footer — simulate slow/failed
// network conditions without touching the real backend. Mirrors the
// #sim-slow/#sim-fail toggles from audit-log-prototype-1.html.
export default function DevModeModal({ open, onClose }) {
  const [slow, setSlow] = useState(false);
  const [fail, setFail] = useState(false);

  const toggleSlow = () => {
    const next = !slow;
    setSlow(next);
    setDevMode({ slow: next });
  };
  const toggleFail = () => {
    const next = !fail;
    setFail(next);
    setDevMode({ fail: next });
  };

  if (!open) return null;

  return createPortal((
    <>
      <div className="overlay show" onClick={onClose} />
      <div className="modal glass-floating show" role="dialog" aria-modal="true" aria-labelledby="dev-mode-title">
        <div className="modal-head">
          <div className="modal-head-title" id="dev-mode-title">Developer mode</div>
          <button className="drawer-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p>This environment runs on simulated data. These controls let you test how the interface behaves under different network conditions.</p>
          <div className="dev-toggle-row">
            <div>
              <div className="dev-toggle-label">Simulate slow network</div>
              <div className="dev-toggle-desc">Adds latency to log and approval requests</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={slow} onChange={toggleSlow} />
              <span className="switch-track" />
            </label>
          </div>
          <div className="dev-toggle-row">
            <div>
              <div className="dev-toggle-label">Simulate request failure</div>
              <div className="dev-toggle-desc">Forces the next log/approvals request to fail</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={fail} onChange={toggleFail} />
              <span className="switch-track" />
            </label>
          </div>
        </div>
      </div>
    </>
  ), document.body);
}
