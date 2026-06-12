// Lightweight achievements derived from existing localStorage stats.
const sumFirstTry = (themeStats) => Object.values(themeStats || {}).reduce((n, s) => n + (s.firstTrySolves || 0), 0)
const themeSolved = (themeStats, theme) => (themeStats?.[theme]?.solved || 0)

export const ACHIEVEMENTS = [
  { id: 'first-steps',  icon: '🎓', name: 'First Steps',      desc: 'Complete your first lesson.',          test: s => Object.keys(s.lessonsCompleted || {}).length >= 1 },
  { id: 'puzzle-solver',icon: '🧩', name: 'Puzzle Solver',    desc: 'Solve 10 puzzles.',                    test: s => (s.puzzlesSolved || 0) >= 10 },
  { id: 'streak-starter',icon: '🔥', name: 'Streak Starter',  desc: 'Reach a 3-puzzle streak.',             test: s => (s.bestStreak || 0) >= 3 },
  { id: 'tactic-hunter',icon: '🎯', name: 'Tactic Hunter',    desc: 'Solve 10 puzzles on the first try.',   test: s => sumFirstTry(s.themeStats) >= 10 },
  { id: 'fork-finder',  icon: '🍴', name: 'Fork Finder',      desc: 'Solve 5 fork puzzles.',                test: s => themeSolved(s.themeStats, 'Fork') >= 5 },
  { id: 'back-rank',    icon: '🏰', name: 'Back-Rank Bouncer',desc: 'Solve 5 back-rank puzzles.',           test: s => themeSolved(s.themeStats, 'Back Rank') >= 5 },
  { id: 'engine-survivor',icon: '🤖', name: 'Engine Survivor',desc: 'Draw or beat a bot.',                  test: s => ((s.games?.wins || 0) + (s.games?.draws || 0)) >= 1 },
  { id: 'rush-10',      icon: '⚡', name: 'Rush Rookie',       desc: 'Score 10 in Puzzle Rush.',             test: s => (s.rushBest || 0) >= 10 },
  { id: '900-club',     icon: '🏅', name: '900 Club',         desc: 'Reach a 900 puzzle rating.',           test: s => (s.rating || 0) >= 900 },
]

export function evaluateAchievements(stats) {
  return ACHIEVEMENTS.map(a => ({ ...a, unlocked: !!a.test(stats) }))
}
