// Each puzzle: fen = position to solve, moves = correct move sequence (UCI), theme, description
export const PUZZLES = [
  {
    id: 1, theme: 'Fork',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    moves: ['f3g5'],
    description: 'White to move. Find the fork!',
  },
  {
    id: 2, theme: 'Pin',
    fen: 'rnbqk2r/ppp2ppp/4pn2/3p4/1bPP4/2N1P3/PP3PPP/R1BQKBNR w KQkq - 2 5',
    moves: ['d1c2'],
    description: 'White to move. Exploit the pin.',
  },
  {
    id: 3, theme: 'Back Rank',
    fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
    moves: ['a1a8'],
    description: 'White to move. Deliver back-rank mate.',
  },
  {
    id: 4, theme: 'Skewer',
    fen: '2k4r/8/8/8/8/8/8/R3K3 w - - 0 1',
    moves: ['a1a8'],
    description: 'White to move. Check the king and win the rook behind it.',
  },
  {
    id: 5, theme: 'Discovered Attack',
    fen: 'r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/2NP4/PPP2PPP/R1BQK1NR b KQkq - 0 4',
    moves: ['c6d4'],
    description: 'Black to move. Unleash the discovered attack.',
  },
  {
    id: 6, theme: 'Smothered Mate',
    fen: '6rk/6pp/7N/8/8/8/8/6K1 w - - 0 1',
    moves: ['h6f7'],
    description: 'White to move. The king is trapped by its own pieces — deliver smothered mate!',
  },
  {
    id: 7, theme: 'Checkmate in 1',
    fen: 'k7/2Q5/K7/8/8/8/8/8 w - - 0 1',
    moves: ['c7b7'],
    description: 'White to move. Find the checkmate in one move.',
  },
  {
    id: 8, theme: 'Double Check',
    fen: 'r1b1kb1r/ppp2ppp/2n5/3qp3/2B5/5N2/PPPPQPPP/RNB1K2R w KQkq - 0 7',
    moves: ['f3e5'],
    description: 'White to move. Win material with a double attack.',
  },
]
