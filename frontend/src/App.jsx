import { useCallback, useState } from "react";
import { WalletProvider, useWallet } from "./context/WalletContext.jsx";
import { AccessRequestProvider } from "./context/AccessRequestContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login/Login.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import AssetRequest from "./pages/AssetRequest/AssetRequest.jsx";
import RiskDecision from "./pages/AssetRequest/RiskDecision/RiskDecision.jsx";
import AuditLog from "./pages/AuditLog/AuditLog.jsx";
import Approvals from "./pages/Approvals/Approvals.jsx";
import Admin from "./pages/Admin/Admin.jsx";
import "./styles/theme.css";

function AppContent() {
  const { status, STATUS, role } = useWallet();
  const [confirmed, setConfirmed] = useState(false);
  const [page, setPage] = useState("dashboard");

  const handleNavigate = useCallback((nextPage) => setPage(nextPage), []);
  const handleGoToRiskDecision = useCallback(() => setPage("riskDecision"), []);
  const handleGoToAssetRequest = useCallback(() => setPage("assetRequest"), []);

  if (!(status === STATUS.CONNECTED || confirmed)) {
    return <Login onConnected={() => setConfirmed(true)} />;
  }

  return (
    <AccessRequestProvider>
      <div className="shell">
        <Sidebar current={page} onNavigate={handleNavigate} />
        {page === "dashboard" && <Dashboard />}
        {page === "assetRequest" && (
          <AssetRequest onNavigateToDecision={handleGoToRiskDecision} />
        )}
        {page === "riskDecision" && (
          <RiskDecision onNavigateToRequest={handleGoToAssetRequest} />
        )}
        {page === "auditLog" && <AuditLog />}
        {page === "approvals" && <Approvals />}
        {page === "admin" && role === "Admin" && <Admin />}
      </div>
    </AccessRequestProvider>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}
