// Validate guided walkthroughs: every player move + scripted reply is legal in
// sequence, and any 'Checkmate' checkpoint actually delivers mate.
// Run with:  npm run validate:guided
import { Chess } from 'chess.js'
import { GUIDED_GAMES } from '../src/data/guidedGames.js'

let errors = 0
const err = (m) => { console.error('  ✗ ' + m); errors++ }

// Check id uniqueness
const ids = GUIDED_GAMES.map(g => g.id)
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
if (dupes.length) err(`Duplicate walkthrough ids: ${dupes.join(', ')}`)

for (const g of GUIDED_GAMES) {
  if (!g.id) err(`Walkthrough missing id`)
  if (!g.startingFen) err(`${g.id}: missing startingFen`)
  if (!g.summary) err(`${g.id}: missing summary`)
  if (!Array.isArray(g.steps) || g.steps.length === 0) err(`${g.id}: missing or empty steps`)

  const game = new Chess()
  let ok = true
  g.steps.forEach((s, i) => {
    if (!ok) return
    if (!s.move || !s.title || !s.instruction || !s.why) err(`${g.id} step ${i + 1}: missing required field (move/title/instruction/why)`)
    if (!Array.isArray(s.highlight) || !Array.isArray(s.arrow)) err(`${g.id} step ${i + 1}: missing highlight/arrow`)

    // Optional field type checks
    const optStrings = ['beginnerTip', 'strategyNote', 'opponentPlan', 'plan', 'phase', 'coachLevelNote', 'matePattern', 'mistakeWarning', 'checkpoint']
    for (const f of optStrings) {
      if (s[f] !== undefined && typeof s[f] !== 'string') err(`${g.id} step ${i + 1}: ${f} must be a string`)
    }

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
