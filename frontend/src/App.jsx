import { useState } from "react";
import { WalletProvider, useWallet } from "./context/WalletContext.jsx";
import Login from "./pages/Login/Login.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import "./styles/theme.css";

function AppContent() {
  const { status, STATUS } = useWallet();
  const [confirmed, setConfirmed] = useState(false);

  // Once wallet connects, flip to the Dashboard. This is intentionally
  // simple (no router) since today's scope is just these two pages.
  if (status === STATUS.CONNECTED || confirmed) {
    return <Dashboard />;
  }

  return <Login onConnected={() => setConfirmed(true)} />;
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}
