// Post-game move classification from white-POV centipawn evals.

export const TAG_META = {
  best:       { label: 'Best',       sym: '★',  color: '#4f8ef7' },
  good:       { label: 'Good',       sym: '✓',  color: '#34c37a' },
  ok:         { label: 'OK',         sym: '',   color: '#7a8a9a' },
  inaccuracy: { label: 'Inaccuracy', sym: '?!', color: '#e0b020' },
  mistake:    { label: 'Mistake',    sym: '?',  color: '#e0843c' },
  blunder:    { label: 'Blunder',    sym: '??', color: '#e05454' },
}

// cpBefore/cpAfter are white-POV centipawns. side is 'w' | 'b' (the mover).
export function classifyMove(cpBefore, cpAfter, side, wasBest) {
  const before = side === 'w' ? cpBefore : -cpBefore
  const after = side === 'w' ? cpAfter : -cpAfter
  const loss = Math.max(0, before - after)
  if (wasBest) return { tag: 'best', loss: 0 }
  if (loss >= 300) return { tag: 'blunder', loss }
  if (loss >= 150) return { tag: 'mistake', loss }
  if (loss >= 70) return { tag: 'inaccuracy', loss }
  if (loss >= 25) return { tag: 'ok', loss }
  return { tag: 'good', loss }
}

// Rough accuracy %: maps average (capped) centipawn loss through a decay curve.
export function accuracyFromLosses(losses) {
  if (!losses.length) return 100
  const avg = losses.reduce((a, l) => a + Math.min(l, 1000), 0) / losses.length
  return Math.max(10, Math.min(100, Math.round(100 * Math.exp(-avg / 300))))
}
