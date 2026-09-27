import { useState } from "react";
import { WalletProvider, useWallet } from "./context/WalletContext.jsx";
import { AccessRequestProvider } from "./context/AccessRequestContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login/Login.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import AssetRequest from "./pages/AssetRequest/AssetRequest.jsx";
import RiskDecision from "./pages/AssetRequest/RiskDecision/RiskDecision.jsx";
import "./styles/theme.css";

function AppContent() {
  const { status, STATUS } = useWallet();
  const [confirmed, setConfirmed] = useState(false);
  const [page, setPage] = useState("dashboard");

  if (!(status === STATUS.CONNECTED || confirmed)) {
    return <Login onConnected={() => setConfirmed(true)} />;
  }

  return (
    <AccessRequestProvider>
      <div className="shell">
        <Sidebar current={page} onNavigate={setPage} />
        {page === "dashboard" && <Dashboard />}
        {page === "assetRequest" && (
          <AssetRequest onNavigateToDecision={() => setPage("riskDecision")} />
        )}
        {page === "riskDecision" && (
          <RiskDecision onNavigateToRequest={() => setPage("assetRequest")} />
        )}
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
