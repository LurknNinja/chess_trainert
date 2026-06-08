# ♟ Chess Trainer

A complete, browser-based chess training app for players of **all levels** — from
your very first move to club-level tactics. Built with React + Vite, runs entirely
in the browser (no backend), and plays against a real Stockfish engine compiled to
WebAssembly.

## Features

### 🎓 Learn Chess (interactive lessons)
A guided curriculum that teaches by *playing on the board*, not just reading:
- **Beginner** — how each piece moves and captures (rook, bishop, queen, knight, captures)
- **Fundamentals** — giving check, back-rank checkmate, castling, pawn promotion
- **Tactics** — the knight fork, the pin, the skewer
- Two interactive formats: *movement drills* (visit every target square) and *guided lines* (follow the moves with explanations). Progress is saved per lesson.

### 🧩 Puzzles & Tactics
- 45 curated, **verified** tactics puzzles spanning forks, pins, skewers, back-rank
  mates, discovered attacks, promotions, smothered mates and more.
- A live **Lichess Daily Puzzle**, fetched and validated on load.
- A **puzzle rating** (Elo-style) that rises and falls with your results, plus a
  solve **streak** counter.
- A **Train My Weaknesses** mode that serves more puzzles from the themes you score
  lowest on.
- Progressive hints (highlight the piece, then the target).

### 🤖 Play vs Engine
- Five strength levels (~800 to ~2400 Elo) powered by Stockfish.
- A live **evaluation bar** and **best-move hint** (full-strength analysis).
- **Takeback**, **board flip**, **resign**, and a running **move list**.
- **Captured-piece tray** with the material balance.
- Win/loss/draw results are recorded to your progress.

### 📖 Opening Trainer
- Learn-and-drill 8 mainline openings (Italian, Ruy López, Sicilian Najdorf,
  Queen's Gambit Declined, London System, Caro-Kann, King's Indian, French) with
  move-by-move annotations and a drill mode that quizzes you.

### ♔ Endgame Trainer
- Practice essential endgames (K+R, K+Q, K+P key squares, opposition, Lucena)
  against the engine, with on-board hint arrows.

### ♞ Piece Guide
- A reference card for every piece: movement diagram, strengths, weaknesses, and a
  signature "power move".

### 📈 My Progress
- Puzzle rating, puzzles solved, best streak, and engine win/loss/draw record.
- Per-theme mastery bars and a "Path to 900 Elo" checklist.

All progress is stored locally in your browser (`localStorage`). Sound effects are
synthesised with the Web Audio API (toggle with the speaker icon in the nav).

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
npm run lint     # eslint
```

## Tech stack

- **React 19** + **Vite**
- **chess.js** — move generation, legality, and game state
- **react-chessboard** — the interactive board
- **stockfish.wasm** — the chess engine (in a Web Worker)
