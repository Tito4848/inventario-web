import type { CollectionSlug, Payload, PayloadRequest, Where } from 'payload'

import type { User } from '@/payload-types'

import { SEED_CODE_PREFIX, SEED_MARKER } from './constants'
import { SeededRng } from './rng'

export type SeedStats = Record<string, number>

export function padCode(prefix: string, index: number, width = 4): string {
  return `${SEED_CODE_PREFIX}-${prefix}-${String(index).padStart(width, '0')}`
}

export function createSeedReq(payload: Payload, user: User): PayloadRequest {
  return { payload, user } as PayloadRequest
}

export async function countDocs(
  payload: Payload,
  collection: CollectionSlug,
  where?: Where,
): Promise<number> {
  const result = await payload.find({
    collection,
    where,
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })
  return result.totalDocs
}

export async function upsertByField<T extends Record<string, unknown>>(params: {
  payload: Payload
  collection: CollectionSlug
  field: string
  value: string
  data: T
}): Promise<{ id: string; created: boolean }> {
  const { payload, collection, field, value, data } = params
  const existing = await payload.find({
    collection,
    where: { [field]: { equals: value } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    const id = String(existing.docs[0].id)
    await payload.update({
      collection,
      id,
      data,
      depth: 0,
      overrideAccess: true,
    })
    return { id, created: false }
  }

  const doc = await payload.create({
    collection,
    data,
    depth: 0,
    overrideAccess: true,
  })
  return { id: String(doc.id), created: true }
}

export async function upsertSetting(params: {
  payload: Payload
  key: string
  value: Record<string, unknown>
  description?: string
  updatedBy?: string
}): Promise<void> {
  const { payload, key, value, description, updatedBy } = params
  const existing = await payload.find({
    collection: 'settings',
    where: { and: [{ key: { equals: key } }, { scope: { equals: 'global' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const data = {
    key,
    value,
    scope: 'global' as const,
    description,
    updatedBy,
  }

  if (existing.docs[0]) {
    await payload.update({
      collection: 'settings',
      id: String(existing.docs[0].id),
      data,
      depth: 0,
      overrideAccess: true,
    })
    return
  }

  await payload.create({
    collection: 'settings',
    data,
    depth: 0,
    overrideAccess: true,
  })
}

export function randomDateInLastMonths(rng: SeededRng, months = 12): string {
  const now = Date.now()
  const start = now - months * 30 * 24 * 60 * 60 * 1000
  return new Date(rng.int(start, now)).toISOString()
}

export function seedNotes(suffix?: string): string {
  return suffix ? `${SEED_MARKER}|${suffix}` : SEED_MARKER
}

export function generateRuc(rng: SeededRng, index: number): string {
  const prefix = rng.pick(['10', '20'])
  const body = String(10000000 + index).slice(-8)
  const base = `${prefix}${body}`
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 10; i++) sum += Number(base[i]) * weights[i]
  const remainder = sum % 11
  const check = remainder < 2 ? remainder : 11 - remainder
  return `${base}${check}`
}

export function generateDni(index: number): string {
  const base = String(10000000 + (index % 90000000)).slice(-8)
  return base
}

export function logPhase(name: string): void {
  console.log(`\n▶ ${name}`)
}

export function logCount(label: string, count: number): void {
  console.log(`  ✓ ${label}: ${count}`)
}
