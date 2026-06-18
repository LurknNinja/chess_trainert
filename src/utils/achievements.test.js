import { describe, it, expect } from 'vitest'
import { ACHIEVEMENTS, evaluateAchievements } from './achievements.js'

const empty = { lessonsCompleted: {}, themeStats: {}, games: {} }

describe('achievements', () => {
  it('nothing is unlocked for a fresh profile', () => {
    const res = evaluateAchievements(empty)
    expect(res.every((a) => !a.unlocked)).toBe(true)
    expect(res).toHaveLength(ACHIEVEMENTS.length)
  })

  it('unlocks puzzle-solver at 10 solves', () => {
    const res = evaluateAchievements({ ...empty, puzzlesSolved: 10 })
    expect(res.find((a) => a.id === 'puzzle-solver').unlocked).toBe(true)
  })

  it('counts first-try solves across themes for tactic-hunter', () => {
    const themeStats = { Fork: { firstTrySolves: 6 }, Pin: { firstTrySolves: 5 } }
    const res = evaluateAchievements({ ...empty, themeStats })
    expect(res.find((a) => a.id === 'tactic-hunter').unlocked).toBe(true)
    expect(res.find((a) => a.id === 'fork-finder').unlocked).toBe(false) // needs 5 *solved*, not firstTry
  })

  it('never throws on partial/missing stats', () => {
    expect(() => evaluateAchievements({})).not.toThrow()
  })
})
