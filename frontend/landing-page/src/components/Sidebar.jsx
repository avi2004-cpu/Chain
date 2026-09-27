// Shared sidebar — used by Dashboard, Asset Request, and Risk Decision so
// the nav (and its glass treatment) is defined in exactly one place, per
// Ayush's shared-component list (Navbar). Extracted from Dashboard.jsx,
// which previously inlined its own copy.
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "assetRequest", label: "Asset Request" },
  { id: "riskDecision", label: "Risk Decision" },
];

export default function Sidebar({ current, onNavigate }) {
  return (
    <aside className="side glass-bar">
      <div className="brand-row">
        <div className="brand-mark" />
        <span className="brand-name">DecentraVault</span>
      </div>
      <nav className="nav-group">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${current === item.id ? "active" : ""}`}
            onClick={() => onNavigate && onNavigate(item.id)}
          >
            {item.label}
          </div>
        ))}
        <div className="nav-item disabled">
          Audit Log <span className="soon-tag">Soon</span>
        </div>
      </nav>
    </aside>
  );
}
