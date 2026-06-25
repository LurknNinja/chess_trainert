import { Chess } from 'chess.js'

export function uciToMove(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }
}

export function isLegalUci(fen, uci) {
  try {
    new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined })
    return true
  } catch { return false }
}

export async function fetchLichessDaily() {
  try {
    const res = await fetch('https://lichess.org/api/puzzle/daily', { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const data = await res.json()
    const { puzzle, game } = data
    if (!puzzle.solution?.length) return null
    const full = new Chess()
    full.loadPgn(game.pgn)
    const verboseMoves = full.history({ verbose: true })
    if (verboseMoves.length < puzzle.initialPly) return null
    const g = new Chess()
    for (let i = 0; i < puzzle.initialPly; i++) {
      const m = verboseMoves[i]
      g.move({ from: m.from, to: m.to, promotion: m.promotion })
    }
    const sol0 = puzzle.solution[0]
    let finalFen = g.fen()
    if (!isLegalUci(finalFen, sol0)) {
      if (verboseMoves.length > puzzle.initialPly) {
        const extra = verboseMoves[puzzle.initialPly]
        g.move({ from: extra.from, to: extra.to, promotion: extra.promotion })
        finalFen = g.fen()
        if (!isLegalUci(finalFen, sol0)) return null
      } else return null
    }
    return {
      id: 'lichess-daily',
      theme: (puzzle.themes?.[0] ?? 'tactics').replace(/([A-Z])/g, ' $1').trim(),
      fen: finalFen, moves: puzzle.solution, rating: puzzle.rating ?? 1500,
      description: 'Today’s puzzle from Lichess.', daily: true,
    }
  } catch { return null }
}
