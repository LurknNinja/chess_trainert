// Shared chess helpers used across training modes.
import { Chess } from 'chess.js'

export function uciToMove(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }
}

// Standard material point values.
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9 }

// Count remaining material for each side and the net advantage (+ = white).
export function materialBalance(fen) {
  const board = new Chess(fen).board()
  let white = 0
  let black = 0
  for (const row of board) {
    for (const sq of row) {
      if (!sq || sq.type === 'k') continue
      const v = VALUE[sq.type] || 0
      if (sq.color === 'w') white += v
      else black += v
    }
  }
  return { white, black, diff: white - black }
}

// Pieces one side has captured from the other, as an array of piece letters,
// derived by comparing the current board against the full starting army.
export function capturedPieces(fen) {
  const START = { p: 8, n: 2, b: 2, r: 2, q: 1 }
  const board = new Chess(fen).board()
  const live = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } }
  for (const row of board) {
    for (const sq of row) {
      if (!sq || sq.type === 'k') continue
      live[sq.color][sq.type] += 1
    }
  }
  const missing = (color) => {
    const out = []
    for (const t of ['q', 'r', 'b', 'n', 'p']) {
      const gone = Math.max(0, START[t] - live[color][t])
      for (let i = 0; i < gone; i++) out.push(t)
    }
    return out
  }
  // White's captures are black pieces that are missing, and vice-versa.
  return { whiteCaptured: missing('b'), blackCaptured: missing('w') }
}

const GLYPH = { wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕', bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛' }
export function pieceGlyph(color, type) {
  return GLYPH[color + type] || ''
}

// Convert a Stockfish "score" into a number from White's perspective (pawns).
// turn is 'w' | 'b' — the side to move when the score was reported.
export function normalizeScore({ type, value }, turn) {
  const sign = turn === 'w' ? 1 : -1
  if (type === 'mate') {
    // Encode mate as a large value, preserving sign and distance.
    return { mate: value * sign, cp: (value > 0 ? 10000 : -10000) * sign }
  }
  return { mate: null, cp: value * sign }
}

// Human-readable eval label, e.g. "+1.4" or "M3".
export function formatEval({ mate, cp }) {
  if (mate !== null && mate !== undefined) {
    const n = Math.abs(mate)
    return (mate > 0 ? 'M' : '-M') + n
  }
  const pawns = cp / 100
  const s = pawns >= 0 ? '+' : ''
  return s + pawns.toFixed(1)
}
