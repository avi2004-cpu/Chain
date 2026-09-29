import { useState } from "react";
import DevModeModal from "./DevModeModal";
import { useWallet } from "../context/WalletContext.jsx";

const ICONS = {
  dashboard: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  assetRequest: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v11H8l-4 4V4z" />
    </svg>
  ),
  riskDecision: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" />
    </svg>
  ),
  auditLog: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="14" y2="18" />
    </svg>
  ),
  approvals: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" />
    </svg>
  ),
  admin: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  inventory: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "assetRequest", label: "Asset Request" },
  { id: "riskDecision", label: "Risk Decision" },
  { id: "auditLog", label: "Audit Log" },
  { id: "approvals", label: "Approvals" },
];

export default function Sidebar({ current, onNavigate }) {
  const [devModeOpen, setDevModeOpen] = useState(false);
  const { role } = useWallet();
  // UI convenience only - the backend does not enforce roles (see docs).
  const navItems = role === "Admin" ? [...NAV_ITEMS, { id: "admin", label: "Admin" }] : NAV_ITEMS;

  return (
    <aside className="side glass-bar">
      <div className="brand-row">
        <div className="brand-mark" />
        <span className="brand-name">DecentraVault</span>
      </div>
      <nav className="nav-group" style={{ flex: 1 }}>
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${current === item.id ? "active" : ""}`}
            onClick={() => onNavigate && onNavigate(item.id)}
          >
            <span className="nav-icon">{ICONS[item.id]}</span>
            {item.label}
          </div>
        ))}
        <div className="nav-item disabled">
          <span className="nav-icon">{ICONS.inventory}</span>
          Asset Inventory <span className="soon-tag">Soon</span>
        </div>
      </nav>

      <div className="side-footer">
        <button className="devmode-btn" onClick={() => setDevModeOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          Developer mode
        </button>
      </div>

      <DevModeModal open={devModeOpen} onClose={() => setDevModeOpen(false)} />
    </aside>
  );
}
