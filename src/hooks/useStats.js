const STORAGE_KEY = 'chess_trainer_stats'
const SCHEMA_VERSION = 1

function defaultState() {
  return { version: SCHEMA_VERSION, themeStats: {} }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    if (parsed.version !== SCHEMA_VERSION || typeof parsed.themeStats !== 'object') return defaultState()
    return parsed
  } catch {
    return defaultState()
  }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* quota exceeded */ }
}

export function recordAttempt(theme, { solved, firstTry, hintsUsed }) {
  if (!theme) return
  const data = load()
  const b = data.themeStats[theme] ?? { attempts: 0, solved: 0, firstTrySolves: 0, hintsUsed: 0 }
  b.attempts += 1
  if (solved) b.solved += 1
  if (solved && firstTry) b.firstTrySolves += 1
  b.hintsUsed += (hintsUsed ?? 0)
  data.themeStats[theme] = b
  save(data)
}

export function getStats() {
  return load()
}

export function clearStats() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}
