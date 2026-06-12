// "Find the Threat" — train defensive vision.
// Each position is the USER's move. The opponent has a threat (threatMove) the
// user must first identify (multiple choice), then neutralise on the board.
// answerId is one of the choice ids. threatMove is null when answer === 'none'.

export const THREAT_CHOICES = [
  { id: 'mate', text: 'A checkmate threat' },
  { id: 'material', text: 'Winning a piece' },
  { id: 'fork', text: 'A fork' },
  { id: 'none', text: 'No real threat' },
]

export const THREATS = [
  {
    id: 'th1', theme: 'Back Rank', rating: 900,
    fen: '4r1k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1',
    answerId: 'mate', threatMove: 'e8e1', solutionMove: 'h2h3',
    explanation: 'Black threatens Re1# on the back rank. Make luft with h3 (or g3) so your king has an escape square.',
  },
  {
    id: 'th2', theme: 'Back Rank', rating: 950,
    fen: 'r5k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1',
    answerId: 'mate', threatMove: 'a8a1', solutionMove: 'g2g3',
    explanation: 'The rook threatens Ra1# behind your pawns. Give the king air with g3 or h3.',
  },
  {
    id: 'th3', theme: 'Hanging Piece', rating: 800,
    fen: '6k1/5pp1/8/7p/6b1/8/5PPP/3Q2K1 w - - 0 1',
    answerId: 'material', threatMove: 'g4d1', solutionMove: 'd1d4',
    explanation: 'The bishop on g4 eyes your queen down the diagonal — ...Bxd1 wins it. Move the queen to safety.',
  },
  {
    id: 'th4', theme: 'Hanging Piece', rating: 850,
    fen: '6k1/8/8/8/8/4n3/8/3Q2K1 w - - 0 1',
    answerId: 'material', threatMove: 'e3d1', solutionMove: 'd1d4',
    explanation: 'The knight attacks your queen — ...Nxd1 wins it. Retreat the queen out of reach.',
  },
  {
    id: 'th5', theme: 'Hanging Piece', rating: 750,
    fen: '6k1/8/p7/1N6/8/8/8/6K1 w - - 0 1',
    answerId: 'material', threatMove: 'a6b5', solutionMove: 'b5c3',
    explanation: 'The a6 pawn attacks your knight. Move it to a safe square before it’s lost.',
  },
  {
    id: 'th6', theme: 'Hanging Piece', rating: 800,
    fen: '6k1/8/3p4/4R3/8/8/8/6K1 w - - 0 1',
    answerId: 'material', threatMove: 'd6e5', solutionMove: 'e5e1',
    explanation: 'The d6 pawn can capture your rook. Slide the rook to safety along the file.',
  },
  {
    id: 'th7', theme: 'Calm', rating: 700,
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    answerId: 'none', threatMove: null, solutionMove: 'g1f3',
    explanation: 'There’s no immediate threat — don’t panic. Develop a piece toward the centre, like Nf3.',
  },
  {
    id: 'th8', theme: 'Hanging Piece', rating: 820,
    fen: '6k1/8/2p5/1B6/8/8/8/6K1 w - - 0 1',
    answerId: 'material', threatMove: 'c6b5', solutionMove: 'b5d3',
    explanation: 'The c6 pawn attacks your bishop — ...cxb5 wins it. Retreat the bishop to a safe diagonal.',
  },
]
