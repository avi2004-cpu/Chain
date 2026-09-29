// Ring gauge for a computed risk score (0-100). Arc color follows the
// same three outcome colors as `.badge` (Allow/Step-Up/Block) rather than
// the 5-tier severity scale, since this app's risk model is a 3-way
// outcome, not a graduated tier — see SKILL.md's RiskGauge/FactorBar note.
const OUTCOME_COLOR = {
  Allow: "var(--allow)",
  "Step-Up": "var(--stepup)",
  Block: "var(--block)",
};
const OUTCOME_LABEL = {
  Allow: "Low Risk",
  "Step-Up": "Elevated Risk",
  Block: "Critical Risk",
};

export default function RiskGauge({ score = 0, outcome = "Allow", size = 200 }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circumference - (circumference * pct) / 100;
  const color = OUTCOME_COLOR[outcome] || "var(--accent)";

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg
        viewBox="0 0 100 100"
        style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}
      >
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface-3)" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: size * 0.17,
            color: "var(--text)",
            lineHeight: 1,
          }}
        >
          {Math.round(pct)}
        </div>
        <div
          style={{
            fontSize: Math.max(10, size * 0.055),
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color,
            marginTop: 6,
          }}
        >
          {OUTCOME_LABEL[outcome] || outcome}
        </div>
      </div>
    </div>
  );
}
