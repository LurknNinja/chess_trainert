import { formatEval } from '../utils/chess.js'

// Vertical evaluation bar (White advantage grows upward), like analysis boards.
export default function EvalBar({ evalScore, height = 480, flipped = false }) {
  const cp = evalScore?.cp ?? 0
  const mate = evalScore?.mate
  // Map centipawns to a 0–100 fill using a smooth, bounded curve.
  let whitePct
  if (mate !== null && mate !== undefined) {
    whitePct = mate > 0 ? 100 : 0
  } else {
    const clamped = Math.max(-1000, Math.min(1000, cp))
    whitePct = 50 + (clamped / 1000) * 50
  }
  const label = evalScore ? formatEval(evalScore) : '0.0'
  const whiteWinning = (mate !== null && mate !== undefined) ? mate > 0 : cp >= 0

  // The bar is oriented so the side at the bottom of the board is at the bottom.
  const whiteAtBottom = !flipped
  const fillBottom = whiteAtBottom ? whitePct : 100 - whitePct

  return (
    <div
      title={`Evaluation: ${label}`}
      style={{
        width: 18,
        height,
        borderRadius: 6,
        overflow: 'hidden',
        background: '#0d1117',
        border: '1px solid #2a2a4a',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: `${fillBottom}%`,
        background: 'linear-gradient(180deg, #f5f5f5, #d8d8d8)',
        transition: 'height 0.35s ease',
      }} />
      <span style={{
        position: 'absolute', left: 0, right: 0,
        [whiteWinning ? 'bottom' : 'top']: 4,
        textAlign: 'center',
        fontSize: 9, fontWeight: 700, fontFamily: 'monospace',
        color: whiteWinning ? '#1a1a2e' : '#e0e0e0',
        textShadow: whiteWinning ? 'none' : '0 1px 2px #000',
      }}>
        {label}
      </span>
    </div>
  )
}
