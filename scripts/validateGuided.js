// Validate guided walkthroughs: every player move + scripted reply is legal in
// sequence, and any 'Checkmate' checkpoint actually delivers mate.
// Run with:  npm run validate:guided
import { Chess } from 'chess.js'
import { GUIDED_GAMES } from '../src/data/guidedGames.js'

let errors = 0
const err = (m) => { console.error('  ✗ ' + m); errors++ }

for (const g of GUIDED_GAMES) {
  const game = new Chess()
  let ok = true
  g.steps.forEach((s, i) => {
    if (!ok) return
    if (!s.move || !s.title || !s.instruction || !s.why) err(`${g.id} step ${i + 1}: missing required field`)
    if (!Array.isArray(s.highlight) || !Array.isArray(s.arrow)) err(`${g.id} step ${i + 1}: missing highlight/arrow`)
    try { game.move({ from: s.move.slice(0, 2), to: s.move.slice(2, 4), promotion: s.move[4] || 'q' }) }
    catch { err(`${g.id} step ${i + 1}: illegal player move ${s.move}`); ok = false; return }
    if (s.checkpoint === 'Checkmate' && !game.isCheckmate()) err(`${g.id} step ${i + 1}: marked Checkmate but not mate`)
    if (s.reply) {
      try { game.move({ from: s.reply.slice(0, 2), to: s.reply.slice(2, 4), promotion: s.reply[4] || 'q' }) }
      catch { err(`${g.id} step ${i + 1}: illegal reply ${s.reply}`); ok = false }
    }
  })
}
console.log(`\n${errors === 0 ? '✓' : '✗'} ${GUIDED_GAMES.length} walkthrough(s) checked — ${errors} error(s)`)
process.exit(errors > 0 ? 1 : 0)
