// Validate the local puzzle set: legality, mate claims, metadata, duplicates.
// Run with:  npm run validate:puzzles
import { Chess } from 'chess.js'
import { PUZZLES } from '../src/data/puzzles.js'

let errors = 0
let warnings = 0
const err = (m) => { console.error('  ✗ ' + m); errors++ }
const warn = (m) => { console.warn('  ! ' + m); warnings++ }
const seenFen = new Map()

for (const p of PUZZLES) {
  const tag = `#${p.id} (${p.theme || 'no theme'})`
  // FEN
  let g
  try { g = new Chess(p.fen) } catch (e) { err(`${tag} bad FEN: ${e.message}`); continue }
  if (g.isCheck()) err(`${tag} side to move already in check`)
  // duplicate FEN
  if (seenFen.has(p.fen)) warn(`${tag} duplicate FEN (also ${seenFen.get(p.fen)})`)
  else seenFen.set(p.fen, tag)
  // metadata
  if (typeof p.rating !== 'number') warn(`${tag} missing numeric rating`)
  if (!p.theme) warn(`${tag} missing theme`)
  if (!p.description) warn(`${tag} missing description`)
  // move sequence legality
  const gg = new Chess(p.fen)
  let ok = true
  for (const uci of (p.moves || [])) {
    try { gg.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }) }
    catch { err(`${tag} illegal move in sequence: ${uci}`); ok = false; break }
  }
  if (!ok) continue
  // mate claims
  if (/Checkmate in 1|Smothered/.test(p.theme) && p.moves.length === 1 && !gg.isCheckmate())
    err(`${tag} themed mate-in-1 but final position is not checkmate`)
  // "mate in 2/3" descriptions should carry the full forced line (>=3 plies)
  const m = /mate in (\d)/i.exec(p.description || '')
  if (m && Number(m[1]) >= 2 && p.moves.length < 2 * Number(m[1]) - 1)
    warn(`${tag} description says "mate in ${m[1]}" but solution has only ${p.moves.length} move(s)`)
}

console.log(`\n${errors === 0 ? '✓' : '✗'} ${PUZZLES.length} puzzles checked — ${errors} error(s), ${warnings} warning(s)`)
process.exit(errors > 0 ? 1 : 0)
