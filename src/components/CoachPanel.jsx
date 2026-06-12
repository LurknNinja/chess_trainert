// A polished coaching card for instructions, feedback, hints, and next steps.
// tone: 'info' | 'good' | 'warning' | 'bad' | 'coach'
const TONE_CLASS = { info: '', good: 'good', warning: 'warning', bad: 'bad', coach: 'coach' }
const TONE_EYEBROW = { good: 'var(--success)', warning: 'var(--warning)', bad: 'var(--danger)', coach: 'var(--gold)', info: 'var(--accent)' }

export default function CoachPanel({ tone = 'info', eyebrow, title, icon, children, actions, compact = false }) {
  return (
    <div className={`coach-card ${TONE_CLASS[tone] || ''} ${compact ? 'compact' : ''}`}>
      {(eyebrow || icon) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">{icon}</span>}
          {eyebrow && <span className="tiny-label" style={{ color: TONE_EYEBROW[tone] }}>{eyebrow}</span>}
        </div>
      )}
      {title && <p style={{ fontWeight: 700, fontSize: 'var(--fs-md)', color: 'var(--text)' }}>{title}</p>}
      {children && <div style={{ color: 'var(--text-soft)', fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>{children}</div>}
      {actions && <div className="button-row" style={{ marginTop: 2 }}>{actions}</div>}
    </div>
  )
}
