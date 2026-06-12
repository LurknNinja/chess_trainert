export default function StatCard({ label, value, sub, color = 'var(--text)', accent }) {
  return (
    <div className="stat-card" style={accent ? { borderTopColor: accent } : undefined}>
      <p className="tiny-label">{label}</p>
      <p className="value" style={{ color, marginTop: 4 }}>{value}</p>
      {sub && <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>{sub}</p>}
    </div>
  )
}
