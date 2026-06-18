import { describe, it, expect, beforeEach } from 'vitest'

// In-memory localStorage so the store can run under Node.
class MemStore {
  constructor() { this.m = new Map() }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null }
  setItem(k, v) { this.m.set(k, String(v)) }
  removeItem(k) { this.m.delete(k) }
}
globalThis.localStorage = new MemStore()

const { getStats, recordAttempt, recordGame, clearStats, getDueReviews, START_RATING } =
  await import('./useStats.js')

beforeEach(() => clearStats())

describe('rating & streaks', () => {
  it('starts at the default rating', () => {
    expect(getStats().rating).toBe(START_RATING)
  })

  it('solving a harder puzzle raises the rating; failing lowers it', () => {
    const up = recordAttempt('Fork', { solved: true, firstTry: true, puzzleRating: 1200, puzzleId: 1 })
    expect(up.rating).toBeGreaterThan(START_RATING)
    clearStats()
    const down = recordAttempt('Fork', { solved: false, firstTry: false, puzzleRating: 1200, puzzleId: 1 })
    expect(down.rating).toBeLessThan(START_RATING)
  })

  it('clean first-try solves build a streak; a miss resets it', () => {
    recordAttempt('Fork', { solved: true, firstTry: true, puzzleRating: 900, puzzleId: 1 })
    const two = recordAttempt('Pin', { solved: true, firstTry: true, puzzleRating: 900, puzzleId: 2 })
    expect(two.streak).toBe(2)
    const miss = recordAttempt('Pin', { solved: false, firstTry: false, puzzleRating: 900, puzzleId: 3 })
    expect(miss.streak).toBe(0)
    expect(miss.bestStreak).toBe(2)
  })

  it('a solve with a hint does not extend the streak', () => {
    const s = recordAttempt('Fork', { solved: true, firstTry: true, hintsUsed: 1, puzzleRating: 900, puzzleId: 1 })
    expect(s.streak).toBe(0)
  })

  it('rating never drops below the floor of 100', () => {
    for (let i = 0; i < 60; i++) recordAttempt('Fork', { solved: false, firstTry: false, puzzleRating: 3000, puzzleId: 1 })
    expect(getStats().rating).toBeGreaterThanOrEqual(100)
  })
})

describe('spaced-repetition integration', () => {
  it('a failed puzzle becomes due for review; a clean solve does not', () => {
    recordAttempt('Fork', { solved: false, firstTry: false, puzzleRating: 900, puzzleId: 7 })
    // Failed cards use a short relearning delay, so check just past it.
    const soon = Date.now() + 11 * 60 * 1000
    expect(getDueReviews(soon)).toContain(7)

    recordAttempt('Pin', { solved: true, firstTry: true, puzzleRating: 900, puzzleId: 8 })
    expect(getDueReviews(soon)).not.toContain(8) // pushed a day out
  })
})

describe('game record', () => {
  it('tallies wins, losses, and draws', () => {
    recordGame('win'); recordGame('win'); recordGame('loss'); recordGame('draw')
    const g = getStats().games
    expect(g).toEqual({ wins: 2, losses: 1, draws: 1 })
  })
})
