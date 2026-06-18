import { describe, it, expect } from 'vitest'
import { GRADE, newCard, schedule, isDue, dueCards, gradeFromResult } from './srs.js'

const DAY = 86_400_000
const T0 = 1_000_000_000_000

describe('srs scheduling', () => {
  it('a brand-new card is due immediately', () => {
    expect(isDue(newCard('p1', T0), T0)).toBe(true)
    expect(isDue(undefined, T0)).toBe(true)
  })

  it('first correct review schedules one day out', () => {
    const c = schedule(newCard('p1', T0), GRADE.GOOD, T0)
    expect(c.reps).toBe(1)
    expect(c.interval).toBe(1)
    expect(c.due).toBe(T0 + DAY)
    expect(isDue(c, T0)).toBe(false)
  })

  it('intervals grow as you keep getting it right', () => {
    let c = newCard('p1', T0)
    c = schedule(c, GRADE.GOOD, T0)          // 1 day
    c = schedule(c, GRADE.GOOD, c.due)        // 3 days
    const third = schedule(c, GRADE.GOOD, c.due)
    expect(third.interval).toBeGreaterThan(c.interval)
  })

  it('failing resets reps, drops ease, and re-shows within minutes', () => {
    let c = schedule(newCard('p1', T0), GRADE.GOOD, T0)
    const failed = schedule(c, GRADE.AGAIN, c.due)
    expect(failed.reps).toBe(0)
    expect(failed.lapses).toBe(1)
    expect(failed.ease).toBeLessThan(c.ease)
    expect(failed.due - c.due).toBeLessThan(DAY) // back soon, not in a day
  })

  it('ease never falls below the floor', () => {
    let c = newCard('p1', T0)
    for (let i = 0; i < 20; i++) c = schedule(c, GRADE.AGAIN, c.due)
    expect(c.ease).toBeGreaterThanOrEqual(1.3)
  })

  it('dueCards returns only due cards, soonest first', () => {
    const cards = {
      a: { id: 'a', due: T0 - DAY },     // overdue
      b: { id: 'b', due: T0 + DAY },     // future
      c: { id: 'c', due: T0 - 2 * DAY }, // most overdue
    }
    const due = dueCards(cards, T0)
    expect(due.map((x) => x.id)).toEqual(['c', 'a'])
  })

  it('maps attempt results to sensible grades', () => {
    expect(gradeFromResult({ solved: false, firstTry: false })).toBe(GRADE.AGAIN)
    expect(gradeFromResult({ solved: true, firstTry: false })).toBe(GRADE.HARD)
    expect(gradeFromResult({ solved: true, firstTry: true, hintsUsed: 1 })).toBe(GRADE.HARD)
    expect(gradeFromResult({ solved: true, firstTry: true, hintsUsed: 0 })).toBe(GRADE.GOOD)
  })
})
