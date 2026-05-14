// moves are in UCI notation
export const OPENINGS = [
  {
    id: 'ruy-lopez',
    name: "Ruy López",
    color: 'white',
    moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'],
    descriptions: [
      "1. e4 — Control the center.",
      "1…e5 — Black mirrors.",
      "2. Nf3 — Attack e5 pawn, develop.",
      "2…Nc6 — Defend e5.",
      "3. Bb5 — The Ruy López! Pin the knight defending e5.",
    ],
  },
  {
    id: 'sicilian',
    name: 'Sicilian Defense',
    color: 'black',
    moves: ['e2e4', 'c7c5'],
    descriptions: [
      "1. e4 — White takes the center.",
      "1…c5 — Sicilian! Fight for d4 asymmetrically.",
    ],
  },
  {
    id: 'queens-gambit',
    name: "Queen's Gambit",
    color: 'white',
    moves: ['d2d4', 'd7d5', 'c2c4'],
    descriptions: [
      "1. d4 — Queen's pawn opening.",
      "1…d5 — Black takes the center.",
      "2. c4 — The Queen's Gambit, attacking d5.",
    ],
  },
  {
    id: 'kings-indian',
    name: "King's Indian Defense",
    color: 'black',
    moves: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'f8g7'],
    descriptions: [
      "1. d4 — White opens.",
      "1…Nf6 — Develop and control e4.",
      "2. c4 — Space.",
      "2…g6 — Prepare the fianchetto.",
      "3. Nc3 — Develop.",
      "3…Bg7 — King's Indian! Hypermodern center control.",
    ],
  },
  {
    id: 'french',
    name: 'French Defense',
    color: 'black',
    moves: ['e2e4', 'e7e6', 'd2d4', 'd7d5'],
    descriptions: [
      "1. e4 — White takes center.",
      "1…e6 — French! Prepare …d5.",
      "2. d4 — White reinforces.",
      "2…d5 — Challenge the center.",
    ],
  },
]
