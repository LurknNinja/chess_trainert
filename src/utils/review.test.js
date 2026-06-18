import { describe, it, expect } from 'vitest'
import { classifyMove, accuracyFromLosses } from './review.js'

describe('classifyMove', () => {
  it('flags the engine move as best', () => {
    expect(classifyMove(50, 40, 'w', true).tag).toBe('best')
  })

  it('classifies white losing centipawns by severity', () => {
    expect(classifyMove(50, -300, 'w', false).tag).toBe('blunder') // -350
    expect(classifyMove(50, -130, 'w', false).tag).toBe('mistake') // -180
    expect(classifyMove(50, -40, 'w', false).tag).toBe('inaccuracy') // -90
    expect(classifyMove(50, 40, 'w', false).tag).toBe('good')        // -10
  })

  it('uses the mover’s perspective for black', () => {
    // Black "loses" when white-POV cp goes UP. From -50 to +250 is a -300 swing for black.
    expect(classifyMove(-50, 250, 'b', false).tag).toBe('blunder')
    // A move that helps black (cp drops) is good, not a blunder.
    expect(classifyMove(-50, -300, 'b', false).tag).toBe('good')
  })
})

describe('accuracyFromLosses', () => {
  it('is 100 with no moves', () => {
    expect(accuracyFromLosses([])).toBe(100)
  })
  it('perfect play is near 100, sloppy play is lower', () => {
    expect(accuracyFromLosses([0, 0, 0])).toBe(100)
    expect(accuracyFromLosses([300, 300, 300])).toBeLessThan(50)
  })
  it('stays within 10–100', () => {
    const a = accuracyFromLosses([5000, 5000])
    expect(a).toBeGreaterThanOrEqual(10)
    expect(a).toBeLessThanOrEqual(100)
  })
})
