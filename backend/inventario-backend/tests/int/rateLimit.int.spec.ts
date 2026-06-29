import { describe, expect, it, beforeEach } from 'vitest'

import {
  checkRateLimit,
  getRateLimitLimitsForTests,
  isRateLimitEnabled,
  resetRateLimitBucketsForTests,
  resolveMiddlewareRateLimitAction,
} from '@/lib/auth/rateLimit'

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimitBucketsForTests()
  })

  it('does not double-apply login on custom auth route (handler owns limit)', () => {
    expect(resolveMiddlewareRateLimitAction('/api/auth/login')).toBeNull()
    expect(resolveMiddlewareRateLimitAction('/api/users/login')).toBe('login')
  })

  it('does not apply refresh limit in middleware', () => {
    expect(resolveMiddlewareRateLimitAction('/api/auth/refresh')).toBeNull()
  })

  it('counts login attempts once per key', () => {
    const limits = getRateLimitLimitsForTests()
    const key = 'test-ip'

    for (let i = 0; i < limits.login.max; i += 1) {
      const result = checkRateLimit(key, 'login')
      expect(result.allowed).toBe(true)
    }

    const blocked = checkRateLimit(key, 'login')
    expect(blocked.allowed).toBe(false)
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    }
  })

  it('uses separate buckets per action', () => {
    const limits = getRateLimitLimitsForTests()
    const key = 'shared-ip'

    for (let i = 0; i < limits.login.max; i += 1) {
      checkRateLimit(key, 'login')
    }

    const loginBlocked = checkRateLimit(key, 'login')
    expect(loginBlocked.allowed).toBe(false)

    const refreshAllowed = checkRateLimit(key, 'refresh')
    expect(refreshAllowed.allowed).toBe(true)
  })

  it('respects RATE_LIMIT_DISABLED', () => {
    const previous = process.env.RATE_LIMIT_DISABLED
    process.env.RATE_LIMIT_DISABLED = 'true'
    try {
      expect(isRateLimitEnabled()).toBe(false)
      for (let i = 0; i < 20; i += 1) {
        expect(checkRateLimit('any', 'login').allowed).toBe(true)
      }
    } finally {
      if (previous === undefined) delete process.env.RATE_LIMIT_DISABLED
      else process.env.RATE_LIMIT_DISABLED = previous
    }
  })
})
