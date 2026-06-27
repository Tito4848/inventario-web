import { describe, expect, it } from 'vitest'

import { Roles } from '@/collections/Roles'
import { Subcategories } from '@/collections/Subcategories'
import { Returns } from '@/collections/Returns'
import { Notifications } from '@/collections/Notifications'
import { Settings } from '@/collections/Settings'

describe('enterprise collections', () => {
  it('registers the expected business collections', () => {
    expect(Roles.slug).toBe('roles')
    expect(Subcategories.slug).toBe('subcategories')
    expect(Returns.slug).toBe('returns')
    expect(Notifications.slug).toBe('notifications')
    expect(Settings.slug).toBe('settings')
  })
})
