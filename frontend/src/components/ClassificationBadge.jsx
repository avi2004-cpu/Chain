// Shared across AssetRequest, RiskDecision (and eventually Audit Log /
// Admin). Deliberately neutral/uncolored — classification and outcome
// are different axes, so this never uses the Allow/Step-Up/Block palette.
// See design-system.md, ".class-tag".
export default function ClassificationBadge({ classification }) {
  return <span className="class-tag">{classification}</span>;
}
