import { apiFetch, type PaginatedResponse } from './api'

export type ManagedUser = {
  id: string
  email: string
  fullName?: string | null
  roles: string[]
  status: 'active' | 'inactive' | 'locked'
  createdAt?: string
  updatedAt?: string
  lastLoginAt?: string | null
}

export type UserListParams = {
  page?: number
  limit?: number
  sort?: string
  search?: string
  status?: string
  role?: string
}

export async function fetchUsers(params: UserListParams = {}) {
  return apiFetch<PaginatedResponse<ManagedUser>>('/api/users/manage', { params })
}

export async function createUser(data: {
  email: string
  password: string
  fullName?: string
  roles: string[]
  status?: string
}) {
  return apiFetch<{ doc: ManagedUser }>('/api/users/manage', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateUser(
  id: string,
  data: Partial<{
    email: string
    password: string
    fullName: string
    roles: string[]
    status: string
  }>,
) {
  return apiFetch<{ doc: ManagedUser }>(`/api/users/manage/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteUser(id: string) {
  return apiFetch<{ message: string }>(`/api/users/manage/${id}`, { method: 'DELETE' })
}

export async function activateUser(id: string) {
  return apiFetch<{ doc: ManagedUser }>(`/api/users/manage/${id}/activate`, { method: 'POST' })
}

export async function deactivateUser(id: string) {
  return apiFetch<{ doc: ManagedUser }>(`/api/users/manage/${id}/deactivate`, { method: 'POST' })
}

export async function resetUserPassword(id: string) {
  return apiFetch<{ message: string }>(`/api/users/manage/${id}/reset-password`, {
    method: 'POST',
  })
}

export async function fetchPublicProducts(params?: { search?: string; limit?: number }) {
  return apiFetch<PaginatedResponse<Record<string, unknown>>>('/api/public/products', { params })
}
