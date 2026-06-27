import type { Where } from 'payload'

export type UserListQuery = {
  page: number
  limit: number
  sort: string
  search?: string
  status?: string
  role?: string
}

export function parseUserListQuery(url: URL): UserListQuery {
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 10)))
  const sort = url.searchParams.get('sort') || '-createdAt'
  const search = url.searchParams.get('search')?.trim() || undefined
  const status = url.searchParams.get('status')?.trim() || undefined
  const role = url.searchParams.get('role')?.trim() || undefined

  return { page, limit, sort, search, status, role }
}

export function buildUserListWhere(query: UserListQuery): Where {
  const conditions: Where[] = []

  if (query.search) {
    conditions.push({
      or: [
        { email: { contains: query.search } },
        { fullName: { contains: query.search } },
      ],
    })
  }

  if (query.status) {
    conditions.push({ status: { equals: query.status } })
  }

  if (query.role) {
    conditions.push({ roles: { contains: query.role } })
  }

  if (!conditions.length) return {}
  if (conditions.length === 1) return conditions[0]
  return { and: conditions }
}

export function parseSortField(sort: string): string {
  return sort.startsWith('-') ? sort.slice(1) : sort
}

export function parseSortDirection(sort: string): 'asc' | 'desc' {
  return sort.startsWith('-') ? 'desc' : 'asc'
}
