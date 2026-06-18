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

// Both starter walkthroughs follow the same sound, principled opening (the
// Italian Game / Giuoco Pianissimo). Every player move is a healthy developing
// move — there are no sacrifices or trick moves — so beginners learn good
// habits: control the centre, develop your pieces, and castle your king to
// safety.
const LINE = [
  { move: 'e2e4', reply: 'e7e5' },
  { move: 'g1f3', reply: 'b8c6' },
  { move: 'f1c4', reply: 'f8c5' },
  { move: 'd2d3', reply: 'd7d6' },
  { move: 'b1c3', reply: 'g8f6' },
  { move: 'e1g1', reply: 'e8g8' },
]
const hl = (m) => [m.slice(0, 2), m.slice(2, 4)]
const stepBase = (i) => ({ move: LINE[i].move, reply: LINE[i].reply, highlight: hl(LINE[i].move), arrow: hl(LINE[i].move) })

export const GUIDED_GAMES = [
  {
    id: 'first-game',
    title: 'Your First Opening',
    level: 'Beginner',
    style: 'Fundamentals',
    goal: 'Learn the three opening goals: control the centre, develop your pieces, and castle.',
    description: 'A move-by-move opening for brand-new players — every move is a good move.',
    startingFen: 'start',
    summary: 'You controlled the centre, developed every minor piece, and castled your king to safety — exactly how a strong game begins. From here, look for a plan and watch for tactics.',
    steps: [
      { ...stepBase(0), title: 'Open the centre', instruction: 'Move your e-pawn two squares forward, to e4.', why: 'It grabs space in the centre and opens lines for your bishop and queen.', beginnerTip: 'The four centre squares (e4, d4, e5, d5) are prime real estate — fight for them early.', checkpoint: 'Control the centre' },
      { ...stepBase(1), title: 'Develop a knight', instruction: 'Bring your knight out to f3.', why: 'It develops a piece toward the centre and attacks Black’s e5 pawn.', beginnerTip: 'Knights belong near the middle — “a knight on the rim is dim.”' },
      { ...stepBase(2), title: 'Develop your bishop', instruction: 'Move your light-squared bishop to c4.', why: 'The bishop takes an active diagonal and eyes Black’s f7 square.', beginnerTip: 'Try to move each piece once before moving the same piece twice.' },
      { ...stepBase(3), title: 'Support the centre', instruction: 'Play d3.', why: 'It defends your e4 pawn and opens a path for your dark-squared bishop.', beginnerTip: 'Small, solid pawn moves like this keep your position healthy.' },
      { ...stepBase(4), title: 'Develop the last knight', instruction: 'Bring your queenside knight to c3.', why: 'Now every minor piece is in the game and helping control the centre.', beginnerTip: 'Count your developed pieces — you’re ahead because you didn’t waste moves.' },
      { ...stepBase(5), title: 'Castle your king to safety', instruction: 'Castle kingside (move the king to g1).', why: 'Castling tucks your king into the corner and connects your rooks. A safe king is the foundation of every good game.', beginnerTip: 'Aim to castle within your first 8–10 moves, almost every game.', checkpoint: 'King safety' },
    ],
  },
  {
    id: 'first-game-strategy',
    title: 'The Same Opening — With Strategy',
    level: 'Beginner+',
    style: 'Strategy',
    goal: 'Understand why the centre, development, and king safety matter — and why patience beats early attacks.',
    description: 'The same line, explained the way a coach thinks.',
    startingFen: 'start',
    summary: 'You saw the plan behind each move: fight for the centre, develop with purpose, and get the king safe before doing anything else. Attacks come later — only once your pieces are ready.',
    steps: [
      { ...stepBase(0), title: 'Claim the centre', instruction: 'Play e4.', why: 'Whoever controls the centre controls the game — central pieces reach more squares.', strategyNote: 'We are not attacking yet. The first job in any game is to fight for the centre and free our pieces.', checkpoint: 'Control the centre' },
      { ...stepBase(1), title: 'Develop with purpose', instruction: 'Play Nf3.', why: 'A good developing move often does two things — here we develop AND hit the e5 pawn.', strategyNote: 'Look for developing moves that also create a small threat. Efficiency wins games.' },
      { ...stepBase(2), title: 'Aim your pieces', instruction: 'Play Bc4.', why: 'The bishop points at f7, Black’s most sensitive square, building quiet pressure.', strategyNote: 'Develop toward your opponent’s weaknesses, but don’t lash out yet — finish development first.' },
      { ...stepBase(3), title: 'Build a solid base', instruction: 'Play d3.', why: 'Defending e4 keeps the centre stable so nothing falls apart while you finish developing.', strategyNote: 'Strong players make their position rock-solid before they go looking for an attack.' },
      { ...stepBase(4), title: 'Complete development', instruction: 'Play Nc3.', why: 'Every minor piece is now active. A lead in development is what makes future attacks work.', strategyNote: 'Attacking before you’ve developed usually backfires — your pieces aren’t there to support it.' },
      { ...stepBase(5), title: 'Safety first', instruction: 'Castle kingside.', why: 'With the king safe and rooks connected, you can finally start planning an attack.', strategyNote: 'The whole opening in one sentence: control the centre, develop everything, get your king safe — then play for the win.', checkpoint: 'King safety' },
    ],
  },
]
