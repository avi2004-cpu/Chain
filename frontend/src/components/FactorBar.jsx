// Per-factor risk breakdown under the RiskGauge. Each factor's bar is
// colored by its own risk level using the 5-tier severity scale
// (--tier-critical/high/medium/low), since within a single factor a
// graduated read makes more sense than the 3-way outcome palette.
function tierColor(riskScore) {
  if (riskScore >= 8) return "var(--tier-critical)";
  if (riskScore >= 6) return "var(--tier-high)";
  if (riskScore >= 4) return "var(--tier-medium)";
  return "var(--tier-low)";
}

export default function FactorBar({ factors = [] }) {
  if (!factors || factors.length === 0) {
    return <p style={{ color: "var(--text-dim)", fontSize: "12.5px" }}>No factor data available.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {factors.map((f) => (
        <div key={f.name}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontSize: "12px",
              marginBottom: "5px",
              gap: "8px",
            }}
          >
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{f.name}</span>
            <span className="mono" style={{ fontSize: "11px", flexShrink: 0 }}>
              weight {f.weight}% · risk {f.riskScore}/10 ·{" "}
              <strong style={{ color: "var(--text)" }}>{f.weighted.toFixed(1)}</strong>
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${f.riskScore * 10}%`, background: tierColor(f.riskScore) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
