import { describe, expect, it } from 'vitest'
import { avatarInitials } from './avatarInitials'

describe('avatarInitials', () => {
  it('takes the first two letters of a single-word name', () => {
    expect(avatarInitials('Ruth')).toBe('RU')
    expect(avatarInitials('Sam')).toBe('SA')
  })

  it('takes the first letter of the first and last word for multi-word names', () => {
    expect(avatarInitials('Professor Okafor')).toBe('PO')
  })

  it('strips a leading "the " before extracting initials', () => {
    expect(avatarInitials('the Registrar')).toBe('RE')
  })

  it('is case-insensitive when stripping "the "', () => {
    expect(avatarInitials('The Registrar')).toBe('RE')
  })

  it('returns a placeholder for an empty name', () => {
    expect(avatarInitials('')).toBe('?')
    expect(avatarInitials('   ')).toBe('?')
  })

  it('collapses extra whitespace between words', () => {
    expect(avatarInitials('Professor   Okafor')).toBe('PO')
  })
})
