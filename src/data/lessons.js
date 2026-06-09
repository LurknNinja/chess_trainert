// Interactive lessons. Two kinds:
//  - mode 'collect': move the highlighted piece to visit every target square
//    (any order). Great for learning how a single piece moves.
//  - mode 'sequence': follow a guided line of moves. Each step expects one move
//    (UCI). An optional `reply` is auto-played by the board afterwards.
//
// All positions are legal and were verified so the expected moves are playable.

export const LESSON_GROUPS = [
  {
    level: 'Beginner',
    blurb: 'How the pieces move and capture — start here if you are new.',
    lessons: [
      {
        id: 'move-rook',
        title: 'The Rook',
        mode: 'collect',
        fen: '8/8/8/8/8/8/8/R7 w - - 0 1',
        piece: 'a1',
        targets: ['a8', 'h8', 'h1'],
        intro: 'The rook moves in straight lines — along ranks and files. Visit each highlighted square.',
        success: 'Nice! The rook controls whole ranks and files. It loves open lines.',
      },
      {
        id: 'move-bishop',
        title: 'The Bishop',
        mode: 'collect',
        fen: '8/8/8/8/8/8/8/2B5 w - - 0 1',
        piece: 'c1',
        targets: ['a3', 'h6', 'f4'],
        intro: 'The bishop moves diagonally and stays on one color forever. Touch each target.',
        success: 'Great — notice the bishop never leaves the dark squares here.',
      },
      {
        id: 'move-queen',
        title: 'The Queen',
        mode: 'collect',
        fen: '8/8/8/8/8/8/8/3Q4 w - - 0 1',
        piece: 'd1',
        targets: ['d8', 'a4', 'h5', 'a1'],
        intro: 'The queen combines rook and bishop — straight AND diagonal lines. Visit every target.',
        success: 'The queen is the most powerful piece. Use it carefully — it is precious!',
      },
      {
        id: 'move-knight',
        title: 'The Knight',
        mode: 'collect',
        fen: '8/8/8/8/8/8/8/1N6 w - - 0 1',
        piece: 'b1',
        targets: ['c3', 'd4', 'e6'],
        intro: 'The knight jumps in an L-shape and can leap over pieces. Hop to each target in turn.',
        success: 'Knights are tricky — they reach squares no other piece can attack.',
      },
      {
        id: 'capture-basics',
        title: 'Capturing',
        mode: 'collect',
        fen: '8/8/8/p3p3/8/2B5/8/8 w - - 0 1',
        piece: 'c3',
        targets: ['a5', 'e5'],
        intro: 'Capture by moving onto an enemy piece. The bishop can take both pawns along its diagonals.',
        success: 'You captured along the diagonals. Always look for what you can take — and what can take you!',
      },
    ],
  },
  {
    level: 'Fundamentals',
    blurb: 'Check, checkmate, and the special moves every player must know.',
    lessons: [
      {
        id: 'deliver-check',
        title: 'Giving Check',
        mode: 'sequence',
        fen: '4k3/8/8/8/8/8/8/Q3K3 w - - 0 1',
        intro: 'A check attacks the enemy king. Move the queen to a1→e1? No — put the king in check now.',
        steps: [
          { instruction: 'Check the black king along the e-file or a diagonal.', move: 'a1a8', explain: 'Qa8+ checks the king down the file. Any move that attacks e8 works as a check.' },
        ],
        success: 'That is a check! The opponent must always respond to a check immediately.',
      },
      {
        id: 'mate-in-1-rook',
        title: 'Back-Rank Mate',
        mode: 'sequence',
        fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
        intro: 'Checkmate is a check the king cannot escape. The black king is trapped by its own pawns.',
        steps: [
          { instruction: 'Deliver checkmate with the rook on the back rank.', move: 'a1a8', explain: 'Ra8# — the king cannot move (pawns block g7/h7/f7) and nothing can block or capture.' },
        ],
        success: 'Checkmate! This “back-rank” pattern wins countless games — watch your own back rank too.',
      },
      {
        id: 'castling',
        title: 'Castling',
        mode: 'sequence',
        fen: 'r3k2r/pppq1ppp/2npbn2/2b1p3/2B1P3/2NPBN2/PPPQ1PPP/R3K2R w KQkq - 0 1',
        intro: 'Castling tucks your king to safety and develops a rook. Castle kingside (drag the king two squares to g1).',
        steps: [
          { instruction: 'Castle kingside: move the king from e1 to g1.', move: 'e1g1', explain: 'O-O: the king goes to g1 and the h1-rook jumps to f1 in one move.' },
        ],
        success: 'Castled! Do this early — a safe king is the foundation of good play.',
      },
      {
        id: 'promotion',
        title: 'Pawn Promotion',
        mode: 'sequence',
        fen: '8/3P4/8/8/8/8/8/4k1K1 w - - 0 1',
        intro: 'A pawn that reaches the far side promotes — usually to a queen. Push the pawn home.',
        steps: [
          { instruction: 'Promote the pawn by moving it to d8.', move: 'd7d8q', explain: 'd8=Q turns a humble pawn into a queen. Promotion can decide the endgame.' },
        ],
        success: 'A brand-new queen! Passed pawns become deadly as the board empties.',
      },
    ],
  },
  {
    level: 'Tactics',
    blurb: 'Win material with the patterns that decide club games.',
    lessons: [
      {
        id: 'tactic-fork',
        title: 'The Knight Fork',
        mode: 'sequence',
        fen: 'r3k3/8/4N3/8/8/8/8/4K3 w - - 0 1',
        intro: 'A fork attacks two pieces at once. The knight can hit the king and the rook together.',
        steps: [
          { instruction: 'Fork the king and rook with your knight.', move: 'e6c7', reply: 'e8d8', explain: 'Nc7+ forks: the king must move, then you grab the rook.' },
          { instruction: 'Now capture the rook on a8.', move: 'c7a8', explain: 'Nxa8 wins the rook. Knights are the best forking pieces.' },
        ],
        success: 'A clean fork wins material out of nowhere — always check for knight forks!',
      },
      {
        id: 'tactic-pin',
        title: 'The Pin',
        mode: 'sequence',
        fen: '4k3/8/8/8/8/4n3/8/4R1K1 w - - 0 1',
        intro: 'A pin freezes a piece in front of a more valuable one. The knight is pinned to its king.',
        steps: [
          { instruction: 'Win the pinned knight — it cannot legally move.', move: 'e1e3', explain: 'Rxe3+ — the knight was pinned to the king on e8, so it could never escape.' },
        ],
        success: 'The pin let you win the knight for free. Pin first, win later!',
      },
      {
        id: 'tactic-skewer',
        title: 'The Skewer',
        mode: 'sequence',
        fen: '3q4/8/8/3k4/8/8/8/R3K3 w - - 0 1',
        intro: 'A skewer is a pin in reverse: check the king so it must move, then take what was behind it.',
        steps: [
          { instruction: 'Check the king along the d-file.', move: 'a1d1', reply: 'd5c5', explain: 'Rd1+ forces the king off the file.' },
          { instruction: 'Capture the queen that was behind the king.', move: 'd1d8', explain: 'Rxd8 wins the queen — a textbook skewer.' },
        ],
        success: 'Skewers win big material. Look for enemy king and queen on the same line.',
      },
      {
        id: 'tactic-double',
        title: 'The Double Attack',
        mode: 'sequence',
        fen: '4k3/1r6/8/8/8/8/8/4K2Q w - - 0 1',
        intro: 'A double attack hits two targets at once. Your queen can check the king and attack the rook with a single move.',
        steps: [
          { instruction: 'Play Qe4 — check the king and hit the rook.', move: 'h1e4', reply: 'e8d8', explain: 'Qe4+ attacks the king down the e-file and the rook along the e4–b7 diagonal.' },
          { instruction: 'Now win the rook.', move: 'e4b7', explain: 'Qxb7 — the opponent could only answer one of the two threats.' },
        ],
        success: 'One move, two threats — the essence of the double attack.',
      },
      {
        id: 'tactic-discovered',
        title: 'The Discovered Attack',
        mode: 'sequence',
        fen: '3qk3/8/8/3N4/8/8/8/3RK3 w - - 0 1',
        intro: 'Moving one piece can unleash an attack from the piece behind it. Your knight is hiding a rook aimed at the queen.',
        steps: [
          { instruction: 'Move the knight with check, uncovering the rook.', move: 'd5f6', reply: 'e8e7', explain: 'Nf6+ checks the king and discovers the rook’s attack down the d-file.' },
          { instruction: 'Capture the queen.', move: 'd1d8', explain: 'Rxd8 — when one move makes two attacks, something has to fall.' },
        ],
        success: 'Discovered attacks are devastating: two pieces strike when one moves.',
      },
    ],
  },
  {
    level: 'Checkmate Patterns',
    blurb: 'The essential mating techniques every player should know by heart.',
    lessons: [
      {
        id: 'mate-ladder',
        title: 'The Ladder (Two Rooks)',
        mode: 'sequence',
        fen: '8/8/6k1/R7/8/8/8/1R2K3 w - - 0 1',
        intro: 'Two rooks checkmate a lone king by walling off ranks and pushing it to the edge — the "ladder".',
        steps: [
          { instruction: 'Check with the back rook, forcing the king up a rank.', move: 'b1b6', reply: 'g6g7', explain: 'Rb6+ seals the 6th rank; the king must retreat.' },
          { instruction: 'Check with the other rook on the next rank.', move: 'a5a7', reply: 'g7g8', explain: 'Ra7+ drives the king to the last rank.' },
          { instruction: 'Deliver checkmate with the back rook.', move: 'b6b8', explain: 'Rb8# — the two rooks control the last two ranks. No escape.' },
        ],
        success: 'The ladder beats a lone king every time — just keep alternating rooks.',
      },
      {
        id: 'mate-smothered',
        title: 'Smothered Mate',
        mode: 'sequence',
        fen: '5r1k/6pp/7N/8/2Q5/8/8/4K3 w - - 0 1',
        intro: 'A knight mates a king trapped by its own pieces. Sacrifice the queen to force it — Philidor’s legendary mate.',
        steps: [
          { instruction: 'Check with the queen on g8 — a sacrifice!', move: 'c4g8', reply: 'f8g8', explain: 'Qg8+! The rook must capture — the king can’t take because the knight guards g8.' },
          { instruction: 'Deliver smothered mate with the knight.', move: 'h6f7', explain: 'Nf7# — the king is smothered by its own rook and pawns.' },
        ],
        success: 'A queen sacrifice clears the way for an unstoppable knight mate.',
      },
    ],
  },
]

export const ALL_LESSONS = LESSON_GROUPS.flatMap(g => g.lessons.map(l => ({ ...l, level: g.level })))
