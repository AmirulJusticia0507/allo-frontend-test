/**
 * services/splitBillApi.ts
 *
 * Client for the Split Bill API. Every endpoint lives under a group, so the
 * functions are grouped by resource and take the group id explicitly.
 * Wire contract: `docs/split-bill-api.md`.
 */

import { SPLIT_BILL_BASE_URL } from '@/config/env'

import { requestJson } from './http'

import type {
  BillGroup,
  Expense,
  ExpenseDraft,
  GroupDraft,
  Payment,
  Settlement,
} from '@/types/splitBill'

interface RequestConfig {
  signal?: AbortSignal
}

/** The backend mounts every resource under `/api`. */
function path (suffix = ''): string {
  return `/groups${suffix}`
}

function request<T> (suffix: string, { signal }: RequestConfig = {}): Promise<T> {
  return requestJson<T>(path(suffix), { baseUrl: SPLIT_BILL_BASE_URL, signal })
}

function post<T> (suffix: string, body: unknown, { signal }: RequestConfig = {}): Promise<T> {
  return requestJson<T>(path(suffix), { baseUrl: SPLIT_BILL_BASE_URL, signal, body })
}

export function fetchGroups ({ signal }: RequestConfig = {}): Promise<BillGroup[]> {
  return request<BillGroup[]>('', { signal })
}

export function fetchGroup (id: string, { signal }: RequestConfig = {}): Promise<BillGroup> {
  return request<BillGroup>(`/${encodeURIComponent(id)}`, { signal })
}

/**
 * Creates a group. The backend turns the participant names into
 * `{ id: 'p_1', name }` pairs — always use the ids from the response.
 */
export function createGroup (draft: GroupDraft, { signal }: RequestConfig = {}): Promise<BillGroup> {
  return post<BillGroup>('', {
    name: draft.name,
    participants: draft.participants.map(name => ({ name })),
  }, { signal })
}

export function fetchExpenses (groupId: string, { signal }: RequestConfig = {}): Promise<Expense[]> {
  return request<Expense[]>(`/${encodeURIComponent(groupId)}/expenses`, { signal })
}

export function addExpense (
  groupId: string,
  draft: ExpenseDraft,
  { signal }: RequestConfig = {},
): Promise<Expense> {
  return post<Expense>(`/${encodeURIComponent(groupId)}/expenses`, draft, { signal })
}

export function addPayment (
  groupId: string,
  payment: Omit<Payment, 'id' | 'createdAt'>,
  { signal }: RequestConfig = {},
): Promise<Payment> {
  return post<Payment>(`/${encodeURIComponent(groupId)}/payments`, payment, { signal })
}

export function fetchSettlement (groupId: string, { signal }: RequestConfig = {}): Promise<Settlement> {
  return request<Settlement>(`/${encodeURIComponent(groupId)}/settlement`, { signal })
}
