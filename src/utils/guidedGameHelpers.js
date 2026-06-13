import { Chess } from 'chess.js'

export function uciToMove(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }
}

// Board position at the START of step `i` (after fully playing steps 0..i-1:
// each step's player move followed by its scripted reply).
export function fenForStep(steps, i) {
  const g = new Chess()
  for (let k = 0; k < i; k++) {
    if (steps[k].move) g.move(uciToMove(steps[k].move))
    if (steps[k].reply) g.move(uciToMove(steps[k].reply))
  }
  return g.fen()
}

// ── Progress (self-contained localStorage, backward-compatible) ──────────────
const KEY = 'chess_trainer_guided'

export function getGuided() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { completed: {}, lastStep: {} }
    const p = JSON.parse(raw)
    return { completed: p.completed || {}, lastStep: p.lastStep || {} }
  } catch { return { completed: {}, lastStep: {} } }
}

function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* ignore */ } }

export function saveGuidedStep(id, step) {
  const d = getGuided()
  d.lastStep[id] = Math.max(d.lastStep[id] || 0, step)
  save(d)
  return d
}

export function saveGuidedComplete(id) {
  const d = getGuided()
  d.completed[id] = true
  save(d)
  return d
}
