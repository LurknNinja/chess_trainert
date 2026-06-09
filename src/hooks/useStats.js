const STORAGE_KEY = 'chess_trainer_stats'
const SCHEMA_VERSION = 2

export const START_RATING = 800

function defaultState() {
  return {
    version: SCHEMA_VERSION,
    themeStats: {},
    rating: START_RATING,
    ratingHistory: [],      // [{ t, rating }]
    puzzlesSolved: 0,
    streak: 0,              // current consecutive first-try-ish solves
    bestStreak: 0,
    games: { wins: 0, losses: 0, draws: 0 },
    lessonsCompleted: {},   // { lessonId: true }
    rushBest: 0,            // best Puzzle Rush score
    missed: {},            // { puzzleId: true } — puzzles to review (spaced repetition)
  }
}

// Migrate older payloads forward so existing users keep their theme history.
function migrate(parsed) {
  const base = defaultState()
  if (!parsed || typeof parsed !== 'object') return base
  return {
    ...base,
    ...parsed,
    version: SCHEMA_VERSION,
    themeStats: (parsed.themeStats && typeof parsed.themeStats === 'object') ? parsed.themeStats : {},
    rating: typeof parsed.rating === 'number' ? parsed.rating : base.rating,
    ratingHistory: Array.isArray(parsed.ratingHistory) ? parsed.ratingHistory : [],
    games: { ...base.games, ...(parsed.games || {}) },
    lessonsCompleted: (parsed.lessonsCompleted && typeof parsed.lessonsCompleted === 'object') ? parsed.lessonsCompleted : {},
    rushBest: typeof parsed.rushBest === 'number' ? parsed.rushBest : 0,
    missed: (parsed.missed && typeof parsed.missed === 'object') ? parsed.missed : {},
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    if (parsed.version !== SCHEMA_VERSION) return migrate(parsed)
    if (typeof parsed.themeStats !== 'object') return defaultState()
    return { ...defaultState(), ...parsed }
  } catch {
    return defaultState()
  }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* quota exceeded */ }
}

// Expected score in the Elo model.
function expected(a, b) {
  return 1 / (1 + Math.pow(10, (b - a) / 400))
}

// Update player rating against a puzzle of the given rating. K-factor scales
// down as the player plays more, for stability.
function updateRating(playerRating, puzzleRating, solved, played) {
  const k = played < 30 ? 40 : played < 100 ? 24 : 16
  const exp = expected(playerRating, puzzleRating)
  const score = solved ? 1 : 0
  return Math.round(playerRating + k * (score - exp))
}

export function recordAttempt(theme, { solved, firstTry, hintsUsed, puzzleRating, puzzleId }) {
  if (!theme) return getStats()
  const data = load()
  const b = data.themeStats[theme] ?? { attempts: 0, solved: 0, firstTrySolves: 0, hintsUsed: 0 }
  b.attempts += 1
  if (solved) b.solved += 1
  if (solved && firstTry) b.firstTrySolves += 1
  b.hintsUsed += (hintsUsed ?? 0)
  data.themeStats[theme] = b

  // Spaced-repetition queue: a clean first-try solve clears a puzzle; any
  // failure (or solving only after a wrong move) marks it for later review.
  if (puzzleId != null) {
    data.missed = data.missed || {}
    if (solved && firstTry) delete data.missed[puzzleId]
    else if (!solved || !firstTry) data.missed[puzzleId] = true
  }

  // Rating + streak only move on a genuine attempt with a known puzzle rating.
  if (typeof puzzleRating === 'number') {
    const before = data.rating
    data.rating = Math.max(100, updateRating(data.rating, puzzleRating, solved, data.puzzlesSolved))
    data.ratingHistory = [...(data.ratingHistory || []), { t: Date.now(), rating: data.rating }].slice(-100)
    if (solved) {
      data.puzzlesSolved = (data.puzzlesSolved || 0) + 1
      if (firstTry && (hintsUsed ?? 0) === 0) {
        data.streak = (data.streak || 0) + 1
        data.bestStreak = Math.max(data.bestStreak || 0, data.streak)
      } else {
        data.streak = 0
      }
    } else {
      data.streak = 0
    }
    data._lastDelta = data.rating - before
  }

  save(data)
  return data
}

export function recordRush(score) {
  const data = load()
  data.rushBest = Math.max(data.rushBest || 0, score)
  save(data)
  return data
}

export function clearMissed(puzzleId) {
  const data = load()
  if (data.missed) delete data.missed[puzzleId]
  save(data)
  return data
}

export function recordGame(result) {
  const data = load()
  if (result === 'win') data.games.wins += 1
  else if (result === 'loss') data.games.losses += 1
  else if (result === 'draw') data.games.draws += 1
  save(data)
  return data
}

export function recordLesson(lessonId) {
  const data = load()
  data.lessonsCompleted[lessonId] = true
  save(data)
  return data
}

export function getStats() {
  return load()
}

export function clearStats() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}
