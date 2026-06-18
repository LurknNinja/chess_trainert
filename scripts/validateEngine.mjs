// Engine-backed correctness gate. For every puzzle we ask Stockfish what the
// best move is and confirm the stored solution agrees — either it IS the
// engine's choice, or it is an equally-winning alternative. Mate-themed
// puzzles must actually force mate. This is what permanently closes the
// "fork that forks nothing / checkmate that isn't mate" bug class.
//
// Run with:  npm run validate:engine
import { Chess } from 'chess.js'
import { PUZZLES } from '../src/data/puzzles.js'
import { GUIDED_GAMES } from '../src/data/guidedGames.js'
import { Engine } from './lib/engine.mjs'

const DEPTH = Number(process.env.VALIDATE_DEPTH || 16)
// A position counts as "winning" for the mover at/above this eval (cp).
const WIN_CP = 200
// Losing this much material vs the best move means the solution is wrong.
const MATERIAL_DROP = 300
// A blunder in a guided line: the player's move drops more than this vs best.
const GUIDED_BLUNDER = 250

let errors = 0
let warnings = 0
const err = (m) => { console.error('  ✗ ' + m); errors++ }
const warn = (m) => { console.warn('  ! ' + m); warnings++ }

// Score after a move, from the perspective of the side that just moved.
async function scoreAfter(eng, fen, uci) {
  const g = new Chess(fen)
  g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' })
  if (g.isCheckmate()) return { mate: 1, scoreCp: null }   // we delivered mate
  if (g.isStalemate() || g.isDraw()) return { mate: null, scoreCp: 0 }
  const r = await eng.analyse(g.fen(), { depth: DEPTH })
  // r is from the new side-to-move (opponent); negate for our perspective.
  if (r.mate != null) return { mate: r.mate === 0 ? 0 : -Math.sign(r.mate) * (Math.abs(r.mate)), scoreCp: null, _opp: true }
  return { mate: null, scoreCp: r.scoreCp == null ? null : -r.scoreCp }
}

// Comparable numeric value (bigger = better for the mover). Mate dominates cp.
function val({ mate, scoreCp }) {
  if (mate != null) return mate > 0 ? 100000 - mate : -100000 - mate
  return scoreCp ?? 0
}
const isWinning = (s) => (s.mate != null ? s.mate > 0 : (s.scoreCp ?? 0) >= WIN_CP)

async function checkPuzzles(eng) {
  console.log(`Engine-checking ${PUZZLES.length} puzzles at depth ${DEPTH}…`)
  for (const p of PUZZLES) {
    const tag = `#${p.id} (${p.theme})`
    const sol = p.moves?.[0]
    if (!sol) { err(`${tag} has no solution move`); continue }

    const best = await eng.analyse(p.fen, { depth: DEPTH })
    if (best.bestmove !== sol && best.bestmove && best.bestmove !== '(none)') {
      const solScore = await scoreAfter(eng, p.fen, sol)
      const bestScore = await scoreAfter(eng, p.fen, best.bestmove)
      const drop = val(bestScore) - val(solScore)
      // Wrong: the engine has a winning tactic the solution throws away, or
      // the solution simply loses material. Otherwise it's a fine alternative.
      if (isWinning(bestScore) && !isWinning(solScore)) {
        err(`${tag} solution ${sol} abandons a winning line — engine plays ${best.bestmove} ` +
            `(${fmt(bestScore)} vs ${fmt(solScore)})`)
        continue
      } else if (drop > MATERIAL_DROP) {
        err(`${tag} solution ${sol} loses material vs ${best.bestmove} (${fmt(bestScore)} vs ${fmt(solScore)})`)
        continue
      } else {
        warn(`${tag} solution ${sol} differs from engine's ${best.bestmove} but is acceptable (${fmt(solScore)})`)
      }
    }

    // Mate-themed puzzles must actually force mate along the stored line.
    if (/Mate|Checkmate|Smothered/i.test(p.theme)) {
      const g = new Chess(p.fen)
      for (const uci of p.moves) g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' })
      if (!g.isCheckmate()) err(`${tag} themed as mate but the stored line does not end in checkmate`)
    }
  }
}

async function checkGuided(eng) {
  console.log(`Engine-checking ${GUIDED_GAMES.length} guided walkthroughs…`)
  for (const game of GUIDED_GAMES) {
    const board = new Chess(game.startingFen === 'start' || !game.startingFen ? undefined : game.startingFen)
    for (let i = 0; i < game.steps.length; i++) {
      const s = game.steps[i]
      const fen = board.fen()
      const best = await eng.analyse(fen, { depth: DEPTH })
      if (best.bestmove !== s.move) {
        const solScore = await scoreAfter(eng, fen, s.move)
        const bestScore = await scoreAfter(eng, fen, best.bestmove)
        const drop = val(bestScore) - val(solScore)
        if (drop > GUIDED_BLUNDER)
          err(`${game.id} step ${i + 1}: recommends ${s.move} which loses ${drop}cp vs ${best.bestmove} — not a sound teaching move`)
      }
      board.move({ from: s.move.slice(0, 2), to: s.move.slice(2, 4), promotion: s.move[4] || 'q' })
      if (s.reply) board.move({ from: s.reply.slice(0, 2), to: s.reply.slice(2, 4), promotion: s.reply[4] || 'q' })
    }
  }
}

const fmt = (s) => (s.mate != null ? `#${s.mate}` : `${(s.scoreCp ?? 0) / 100}`)

const eng = await Engine.start()
try {
  await checkPuzzles(eng)
  await checkGuided(eng)
} finally {
  await eng.quit()
}
console.log(`\n${errors === 0 ? '✓' : '✗'} engine validation — ${errors} error(s), ${warnings} warning(s)`)
process.exit(errors > 0 ? 1 : 0)
