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
- **Tactics** — knight fork, pin, skewer, double attack, discovered attack
- **Checkmate Patterns** — the two-rook ladder mate and Philidor's smothered mate
- Two interactive formats: *movement drills* (visit every target square, with
  legal-move dots) and *guided lines* (follow the moves with explanations).
  Progress is saved per lesson.

### 🧩 Puzzles & Tactics
- 45 curated, **verified** tactics puzzles spanning forks, pins, skewers, back-rank
  mates, discovered attacks, promotions, smothered mates and more.
- A live **Lichess Daily Puzzle**, fetched and validated on load.
- A **puzzle rating** (Elo-style) that rises and falls with your results, plus a
  solve **streak** counter.
- **Train My Weaknesses** serves more puzzles from your lowest-scoring themes, and
  **Review Mistakes** re-drills the puzzles you got wrong (spaced repetition).
- Progressive hints (highlight the piece, then the target).

### ⚡ Puzzle Rush
- A 3-minute timed mode: solve as many puzzles as you can, easiest first. Three
  wrong moves ends the run. Tracks your all-time best score.

### 🤖 Play vs Engine
- Five strength levels (~800 to ~2400 Elo) powered by Stockfish.
- A live **evaluation bar** and **best-move hint** (full-strength analysis).
- **Takeback**, **board flip**, **resign**, and a running **move list**.
- **Captured-piece tray** with the material balance.
- **Game Review** — after the game, every move is analysed and labelled
  best/inaccuracy/mistake/blunder with an **accuracy score**, and you can step
  through the game with the move arrow coloured by its quality.
- Win/loss/draw results are recorded to your progress.

### 📖 Opening Trainer
- Learn-and-drill 10 mainline openings (Italian, Ruy López, Sicilian Najdorf,
  Queen's Gambit Declined, London, Caro-Kann, King's Indian, French, Scotch,
  English) with move-by-move annotations and a drill mode that quizzes you.

### ♔ Endgame Trainer
- Practice essential endgames (K+R, K+Q, K+P key squares, opposition, Lucena)
  against the engine, with on-board hint arrows.

### ♞ Piece Guide & 📚 Glossary
- A reference card for every piece: movement diagram, strengths, weaknesses, and a
  signature "power move".
- A searchable **glossary** of 36 essential terms grouped by topic.

### 📈 My Progress
- Puzzle rating (with an over-time chart), puzzles solved, best streak, Puzzle Rush
  best, and engine win/loss/draw record.
- Per-theme mastery bars and a "Path to 900 Elo" checklist.

### ⚙️ Board & Settings
- **Tap-to-move** with legal-move dots, **last-move** and **check** highlighting on
  every board.
- Five board themes, highlight toggles, animation speed, and a sound toggle —
  all in **Settings**.

All progress and preferences are stored locally in your browser (`localStorage`).
Sound effects are synthesised with the Web Audio API.

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
