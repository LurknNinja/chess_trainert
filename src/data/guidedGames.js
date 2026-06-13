// Guided Games — "paint-by-numbers chess".
// The player is walked through a scripted line one move at a time. Each step:
//   move          UCI of the move the PLAYER makes (always White here)
//   reply          UCI of the opponent's scripted reply (null on the final move)
//   title          short label for the move
//   instruction    what to play, in plain English
//   why            why the move matters
//   beginnerTip    a friendly extra tip (optional)
//   strategyNote   deeper strategic framing (optional, used by the +strategy game)
//   highlight      [from, to] squares to highlight
//   arrow          [from, to] arrow to draw
//   checkpoint     optional milestone label (e.g. 'King safety')
//   mistakeWarning optional caution shown with the move
//
// FUTURE CATEGORIES (data-structure ready, not built yet):
//   Opening Principles · Italian Game · Queen's Gambit · King's Gambit ·
//   Caro-Kann Defense · Aggressive Attacking · Defensive Survival ·
//   Endgame Conversion · Grandmaster Thinking
// New walkthroughs just add another object below with the same shape.

// Both starter walkthroughs follow the same legal, classic miniature (Légal's
// Mate). White develops naturally; Black grabs material instead of getting the
// king safe, and is checkmated in the centre — a vivid lesson in king safety.
const LINE = [
  { move: 'e2e4', reply: 'e7e5' },
  { move: 'g1f3', reply: 'b8c6' },
  { move: 'f1c4', reply: 'd7d6' },
  { move: 'b1c3', reply: 'c8g4' },
  { move: 'f3e5', reply: 'g4d1' },
  { move: 'c4f7', reply: 'e8e7' },
  { move: 'c3d5', reply: null },
]
const hl = (m) => [m.slice(0, 2), m.slice(2, 4)]
const stepBase = (i) => ({ move: LINE[i].move, reply: LINE[i].reply, highlight: hl(LINE[i].move), arrow: hl(LINE[i].move) })

export const GUIDED_GAMES = [
  {
    id: 'first-game',
    title: 'Your First Complete Game',
    level: 'Beginner',
    style: 'Fundamentals',
    goal: 'Learn development, king safety, simple threats, and checkmate.',
    description: 'A move-by-move game for brand-new players.',
    startingFen: 'start',
    summary: 'You developed your pieces toward the centre, created threats, and punished a king that never got safe — finishing with checkmate.',
    steps: [
      { ...stepBase(0), title: 'Open the centre', instruction: 'Move your e-pawn two squares forward, to e4.', why: 'It grabs space in the centre and opens lines for your queen and bishop.', beginnerTip: 'The four centre squares (e4, d4, e5, d5) are prime real estate. Fight for them early.', checkpoint: 'Control the centre' },
      { ...stepBase(1), title: 'Develop a knight', instruction: 'Bring your knight out to f3.', why: 'It develops a piece toward the centre and attacks Black’s e5 pawn.', beginnerTip: 'In the opening, try to move each piece once before moving the same piece twice.' },
      { ...stepBase(2), title: 'Develop your bishop', instruction: 'Move your light-squared bishop to c4.', why: 'The bishop eyes f7 — the weakest square near Black’s king.', beginnerTip: 'Bishops love long, open diagonals. c4 aims straight at Black’s most vulnerable point.' },
      { ...stepBase(3), title: 'Develop the other knight', instruction: 'Bring your queenside knight to c3.', why: 'Another piece in the game, and it eyes the d5 and e4 squares.', beginnerTip: 'You’ve now developed three pieces. Black has only moved pawns and a bishop.' },
      { ...stepBase(4), title: 'Spring the trap', instruction: 'Take the e5 pawn with your knight (Nxe5).', why: 'It looks like you’re leaving your queen unprotected — that’s the bait! If Black grabs it, checkmate follows.', beginnerTip: 'Black’s bishop is pinning your knight, but the pin is an illusion here.', mistakeWarning: 'Black will greedily take your queen — exactly what you want.' },
      { ...stepBase(5), title: 'Check with the bishop', instruction: 'Capture on f7 with your bishop, giving check (Bxf7+).', why: 'The king is dragged into the open, right into your developed pieces.', beginnerTip: 'Checks are forcing — your opponent must respond immediately.' },
      { ...stepBase(6), title: 'Checkmate!', instruction: 'Deliver checkmate by jumping the knight to d5 (Nd5#).', why: 'The king is trapped in the centre with no escape — your developed pieces did all the work.', beginnerTip: 'Notice the lesson: Black never castled, so the king was mated in the middle of the board.', checkpoint: 'Checkmate' },
    ],
  },
  {
    id: 'first-game-strategy',
    title: 'The Same Game — With Strategy',
    level: 'Beginner+',
    style: 'Strategy',
    goal: 'Understand why the centre, development, king safety, and patience matter.',
    description: 'The same line, explained the way a coach thinks.',
    startingFen: 'start',
    summary: 'You saw how steady development and central control build an attack — and how grabbing material instead of getting the king safe loses games.',
    steps: [
      { ...stepBase(0), title: 'Claim the centre', instruction: 'Play e4.', why: 'Whoever controls the centre controls the game — central pieces reach more squares.', strategyNote: 'We are not attacking yet. The first job in any game is to fight for the centre and free our pieces.', checkpoint: 'Control the centre' },
      { ...stepBase(1), title: 'Develop with purpose', instruction: 'Play Nf3.', why: 'Every developing move should ideally do two things — here we develop AND hit the e5 pawn.', strategyNote: 'Good moves multitask. Look for developing moves that also create a small threat.' },
      { ...stepBase(2), title: 'Aim at the weakness', instruction: 'Play Bc4.', why: 'f7 is only defended by Black’s king. Pointing pieces at it builds long-term pressure.', strategyNote: 'Identify your opponent’s weakest point early, then aim your pieces at it.' },
      { ...stepBase(3), title: 'Finish development', instruction: 'Play Nc3.', why: 'Three pieces out, all working toward the centre. Black, meanwhile, has wasted time.', strategyNote: 'Count developed pieces. A lead in development is the green light to look for action.' },
      { ...stepBase(4), title: 'Convert the lead', instruction: 'Play Nxe5.', why: 'A development lead lets you strike. The “hanging” queen is a calculated trap, not a blunder.', strategyNote: 'Tactics flow from a better position. Because we developed first, this combination works.' },
      { ...stepBase(5), title: 'Open the king', instruction: 'Play Bxf7+.', why: 'Black’s greed (taking the queen) left the king stuck in the centre. Now we pounce.', strategyNote: 'This is the punishment for grabbing material instead of castling. Safety first, always.' },
      { ...stepBase(6), title: 'Deliver mate', instruction: 'Play Nd5#.', why: 'Coordinated, developed pieces deliver mate against a king that never found shelter.', strategyNote: 'The whole game in one sentence: develop, control the centre, keep your king safe, then attack.', checkpoint: 'Checkmate' },
    ],
  },
]
