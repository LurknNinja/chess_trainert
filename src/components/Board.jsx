import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useSettings, THEMES } from '../hooks/useSettings.js'

const FILES = 'abcdefgh'

// Parse the placement field of a FEN into { square: 'wP', ... }.
function placementMap(fen) {
  const map = {}
  const rows = (fen || '').split(' ')[0].split('/')
  for (let r = 0; r < rows.length; r++) {
    let f = 0
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) { f += +ch; continue }
      map[FILES[f] + (8 - r)] = (ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase()
      f++
    }
  }
  return map
}

// Squares whose occupant changed between two positions (≈ the last move).
function changedSquares(a, b) {
  const ma = placementMap(a), mb = placementMap(b)
  const out = []
  for (const sq of new Set([...Object.keys(ma), ...Object.keys(mb)])) {
    if (ma[sq] !== mb[sq]) out.push(sq)
  }
  return out
}

// The square of a king that is currently in check (or null).
function checkedKingSquare(fen) {
  try {
    const g = new Chess(fen)
    if (!g.isCheck()) return null
    const turn = g.turn()
    for (const row of g.board()) for (const p of row) {
      if (p && p.type === 'k' && p.color === turn) return p.square
    }
  } catch { /* kingless / invalid position */ }
  return null
}

/**
 * Shared chess board: applies the user's theme, animation, last-move and check
 * highlights, and click/tap-to-move with legal-move dots. `onDrop` keeps the
 * react-chessboard signature: ({ sourceSquare, targetSquare, piece }) => boolean.
 */
export default function Board({
  position,
  orientation = 'white',
  onDrop,
  allowDragging = true,
  interactive,
  arrows = [],
  squareStyles = {},
  getLegalTargets,
  id = 'board',
}) {
  const settings = useSettings()
  const theme = THEMES[settings.theme] || THEMES.classic
  const tapEnabled = (interactive ?? allowDragging)

  const [selected, setSelected] = useState(null) // { square, piece }
  const [lastMove, setLastMove] = useState([])
  const prevPos = useRef(position)

  // Track the last move via position diff (works for every mode, no extra wiring).
  useEffect(() => {
    if (prevPos.current && prevPos.current !== position) {
      const changed = changedSquares(prevPos.current, position)
      // Only treat small diffs as a move; large diffs are resets / new positions.
      setLastMove(changed.length > 0 && changed.length <= 4 ? changed : [])
    }
    prevPos.current = position
    setSelected(null)
  }, [position])

  const turn = (position || '').split(' ')[1] || 'w'

  function legalTargets(square) {
    if (getLegalTargets) return getLegalTargets(square) || []
    try { return new Chess(position).moves({ square, verbose: true }).map(m => m.to) }
    catch { return [] }
  }

  // react-chessboard fires onSquareClick for empty squares and onPieceClick for
  // pieces (the piece overlay swallows the square click); both route here.
  // `pieceType` is a string like 'wP' or undefined.
  function clickSquare(square, pieceType) {
    if (!tapEnabled) return
    if (selected) {
      if (square === selected.square) { setSelected(null); return }
      const ok = onDrop?.({ sourceSquare: selected.square, targetSquare: square, piece: selected.piece })
      setSelected(null)
      // If the move was rejected but they tapped their own piece, reselect it.
      if (!ok && pieceType && pieceType[0] === turn) setSelected({ square, piece: pieceType })
      return
    }
    if (pieceType && pieceType[0] === turn) setSelected({ square, piece: pieceType })
  }
  const handleSquareClick = ({ piece, square }) => clickSquare(square, piece?.pieceType)
  const handlePieceClick = ({ piece, square }) => clickSquare(square, piece?.pieceType)

  // Build square styles: last move → check → caller styles → legal dots → selection.
  const styles = {}
  if (settings.showLastMove) for (const sq of lastMove) styles[sq] = { background: theme.accent }
  if (settings.highlightCheck) {
    const k = checkedKingSquare(position)
    if (k) styles[k] = { background: 'radial-gradient(circle, rgba(224,84,84,0.9) 0%, rgba(224,84,84,0.35) 70%, transparent 75%)' }
  }
  Object.assign(styles, squareStyles)
  if (settings.showLegalMoves && selected) {
    styles[selected.square] = { ...(styles[selected.square] || {}), background: theme.accent }
    for (const t of legalTargets(selected.square)) {
      const isCapture = !!placementMap(position)[t]
      styles[t] = isCapture
        ? { background: 'radial-gradient(circle, transparent 52%, rgba(40,40,60,0.5) 54%, rgba(40,40,60,0.5) 62%, transparent 64%)' }
        : { background: 'radial-gradient(circle, rgba(40,40,60,0.55) 18%, transparent 22%)' }
    }
  }

  return (
    <div style={{ width: '100%', aspectRatio: '1 / 1' }}>
      <Chessboard
        options={{
          id,
          position,
          onPieceDrop: onDrop,
          onSquareClick: handleSquareClick,
          onPieceClick: handlePieceClick,
          boardOrientation: orientation,
          animationDurationInMs: settings.animationMs,
          darkSquareStyle: { backgroundColor: theme.dark },
          lightSquareStyle: { backgroundColor: theme.light },
          boardStyle: { borderRadius: 8, boxShadow: '0 4px 24px #0006', gridTemplateRows: 'repeat(8, 1fr)' },
          squareStyles: styles,
          arrows,
          allowDragging,
        }}
      />
    </div>
  )
}
