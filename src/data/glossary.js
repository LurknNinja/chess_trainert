// Chess glossary — concise, beginner-friendly definitions grouped by category.
export const GLOSSARY = [
  // ── Basics ────────────────────────────────────────────────────────────────
  { term: 'Check', cat: 'Basics', def: 'A direct attack on the king. You must respond immediately by moving the king, blocking, or capturing the attacker.' },
  { term: 'Checkmate', cat: 'Basics', def: 'The king is in check and has no legal way to escape. This ends the game — the mating side wins.' },
  { term: 'Stalemate', cat: 'Basics', def: 'The side to move has no legal move but is NOT in check. The game is an immediate draw.' },
  { term: 'File', cat: 'Basics', def: 'A column of the board, labelled a–h.' },
  { term: 'Rank', cat: 'Basics', def: 'A row of the board, numbered 1–8.' },
  { term: 'Diagonal', cat: 'Basics', def: 'A slanted line of same-coloured squares — the bishop’s and queen’s highway.' },
  { term: 'Development', cat: 'Basics', def: 'Bringing your knights and bishops off the back rank into active positions early in the game.' },
  { term: 'Material', cat: 'Basics', def: 'The pieces you have. Rough values: pawn 1, knight/bishop 3, rook 5, queen 9.' },
  { term: 'Tempo', cat: 'Basics', def: 'A unit of time — one move. You "gain a tempo" when you develop while forcing the opponent to react.' },

  // ── Special moves ───────────────────────────────────────────────────────────
  { term: 'Castling', cat: 'Special Moves', def: 'A king-and-rook move for king safety: the king shifts two squares toward a rook and the rook hops to its other side. Needs empty squares, an unmoved king and rook, and the king not moving through check.' },
  { term: 'En passant', cat: 'Special Moves', def: '"In passing" — if an enemy pawn advances two squares and lands beside your pawn, you may capture it as if it had moved only one square, but only on the very next move.' },
  { term: 'Promotion', cat: 'Special Moves', def: 'A pawn reaching the far rank becomes any piece (almost always a queen).' },
  { term: 'Underpromotion', cat: 'Special Moves', def: 'Promoting to a knight, rook, or bishop instead of a queen — occasionally the only winning choice.' },

  // ── Tactics ───────────────────────────────────────────────────────────────
  { term: 'Fork', cat: 'Tactics', def: 'One piece attacks two or more enemy pieces at once. Knights are the classic forking piece.' },
  { term: 'Pin', cat: 'Tactics', def: 'A piece can’t move because doing so would expose a more valuable piece (or the king) behind it.' },
  { term: 'Skewer', cat: 'Tactics', def: 'A pin in reverse: a valuable piece is attacked and, when it moves, a piece behind it is captured.' },
  { term: 'Discovered Attack', cat: 'Tactics', def: 'Moving one piece reveals an attack from another piece behind it. A discovered check is especially powerful.' },
  { term: 'Double Attack', cat: 'Tactics', def: 'A single move that creates two threats at once, so the opponent can only meet one.' },
  { term: 'Deflection', cat: 'Tactics', def: 'Forcing an enemy piece away from an important defensive duty.' },
  { term: 'Zwischenzug', cat: 'Tactics', def: 'An "in-between move" — inserting an unexpected threat before making the expected recapture.' },
  { term: 'Back-rank Mate', cat: 'Tactics', def: 'A checkmate on the 1st/8th rank where the king is trapped behind its own unmoved pawns.' },
  { term: 'Smothered Mate', cat: 'Tactics', def: 'A knight checkmate where the king is completely boxed in by its own pieces.' },
  { term: 'Sacrifice', cat: 'Tactics', def: 'Giving up material on purpose to gain a bigger advantage — an attack, mate, or winning position.' },

  // ── Strategy ────────────────────────────────────────────────────────────────
  { term: 'Initiative', cat: 'Strategy', def: 'The ability to make threats and force your opponent to respond, keeping them on the defensive.' },
  { term: 'Open File', cat: 'Strategy', def: 'A file with no pawns. Rooks dominate open files.' },
  { term: 'Outpost', cat: 'Strategy', def: 'A square (often supported by a pawn) where a knight can sit safely deep in enemy territory.' },
  { term: 'Passed Pawn', cat: 'Strategy', def: 'A pawn with no enemy pawns able to stop it from promoting on its file or adjacent files.' },
  { term: 'Isolated Pawn', cat: 'Strategy', def: 'A pawn with no friendly pawns on neighbouring files — a long-term weakness.' },
  { term: 'Doubled Pawns', cat: 'Strategy', def: 'Two friendly pawns on the same file, usually a structural weakness.' },
  { term: 'Fianchetto', cat: 'Strategy', def: 'Developing a bishop to b2/g2 (or b7/g7) to rake the long diagonal.' },
  { term: 'Bishop Pair', cat: 'Strategy', def: 'Having both bishops while the opponent does not — a lasting edge in open positions.' },

  // ── Endgame ───────────────────────────────────────────────────────────────
  { term: 'Opposition', cat: 'Endgame', def: 'Kings facing each other with one square between them. The side NOT to move "has the opposition" and controls key squares.' },
  { term: 'Key Squares', cat: 'Endgame', def: 'Squares your king must reach to force a pawn through to promotion.' },
  { term: 'Lucena Position', cat: 'Endgame', def: 'A famous winning rook endgame where you "build a bridge" to shelter your king and promote.' },
  { term: 'Philidor Position', cat: 'Endgame', def: 'A key drawing technique in rook endgames using third-rank defence.' },
  { term: 'Zugzwang', cat: 'Endgame', def: 'A position where any move a player makes worsens their position — but they’re forced to move.' },
]

export const GLOSSARY_CATS = [...new Set(GLOSSARY.map(g => g.cat))]
