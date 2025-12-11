import { cn, formatDate, formatDateTime, calculateAge } from '../utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-4', 'px-4')).toBe('py-4 px-4')
  })
})

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15')
    const result = formatDate(date)
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })

  it('handles string input', () => {
    const result = formatDate('2024-01-15')
    expect(result).toContain('2024')
  })
})

describe('formatDateTime', () => {
  it('formats date and time correctly', () => {
    const date = new Date('2024-01-15T14:30:00')
    const result = formatDateTime(date)
    expect(result).toContain('2024')
  })
})

describe('calculateAge', () => {
  it('calculates age correctly', () => {
    const birthDate = new Date()
    birthDate.setFullYear(birthDate.getFullYear() - 30)
    expect(calculateAge(birthDate.toISOString().split('T')[0])).toBe(30)
  })

  it('handles birthday not yet occurred this year', () => {
    const now = new Date()
    const birthDate = new Date(now.getFullYear() - 25, now.getMonth() + 1, 15)
    const age = calculateAge(birthDate.toISOString().split('T')[0])
    expect(age).toBe(24)
  })
})
