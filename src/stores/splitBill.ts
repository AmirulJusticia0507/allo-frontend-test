/**
 * stores/splitBill.ts
 *
 * State for the Split Bill screens:
 * - list of groups, plus a per-group detail cache (expenses + settlement),
 * - loading / error / success state per request scope,
 * - request cancellation so fast navigation never leaks late responses.
 *
 * Every write (create group, add expense, add payment) refreshes the cached
 * data it invalidates, so the screens never show a stale balance.
 */

import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

import {
  addExpense as postExpense,
  addPayment as postPayment,
  createGroup as postGroup,
  fetchExpenses,
  fetchGroup,
  fetchGroups,
  fetchSettlement,
} from '@/services/splitBillApi'
import { isAbortError } from '@/services/http'

import type { AsyncState } from '@/types/asyncState'
import type {
  BillGroup,
  Expense,
  ExpenseDraft,
  GroupDraft,
  Payment,
  Settlement,
} from '@/types/splitBill'

function errorMessage (error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function initialState<T> (): AsyncState<T> {
  return { data: null, status: 'idle', error: null }
}

/** Per-group data, loaded by two independent requests. */
export interface GroupDetail {
  group: AsyncState<BillGroup>
  expenses: AsyncState<Expense[]>
  settlement: AsyncState<Settlement>
}

function emptyDetail (): GroupDetail {
  return {
    group: initialState(),
    expenses: initialState(),
    settlement: initialState(),
  }
}

export const useSplitBillStore = defineStore('splitBill', () => {
  const groupsState = reactive<AsyncState<BillGroup[]>>(initialState())
  const details = reactive<Record<string, GroupDetail>>({})

  const listController = ref<AbortController | null>(null)
  const detailControllers = new Map<string, AbortController>()

  function detailState (groupId: string): GroupDetail {
    if (!details[groupId]) details[groupId] = emptyDetail()
    return details[groupId]
  }

  // ── Groups ──────────────────────────────────────────────────────────────────

  /** Loads the group list. No-op unless idle or `force`. */
  async function loadGroups ({ force = false }: { force?: boolean } = {}): Promise<void> {
    if (!force && (groupsState.status === 'loading' || groupsState.status === 'success')) return

    listController.value?.abort()
    const controller = new AbortController()
    listController.value = controller

    groupsState.status = 'loading'
    groupsState.error = null

    try {
      const result = await fetchGroups({ signal: controller.signal })
      if (controller.signal.aborted) return
      groupsState.data = result
      groupsState.status = 'success'
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) return
      groupsState.status = 'error'
      groupsState.error = errorMessage(error)
    } finally {
      if (listController.value === controller) listController.value = null
    }
  }

  async function createGroup (draft: GroupDraft): Promise<BillGroup | null> {
    const group = await postGroup(draft)

    // Seed the list and detail cache so the new group opens without a round-trip.
    groupsState.data = [...(groupsState.data ?? []), group]
    groupsState.status = 'success'
    groupsState.error = null

    const detail = detailState(group.id)
    detail.group = { data: group, status: 'success', error: null }
    return group
  }

  // ── Group detail (expenses + settlement) ────────────────────────────────────

  /** Loads the group, its expenses and its settlement in parallel. */
  async function loadGroup (
    groupId: string,
    { force = false }: { force?: boolean } = {},
  ): Promise<void> {
    const detail = detailState(groupId)
    const inFlight = detailControllers.get(groupId)

    if (!force && inFlight) return
    if (!force && detail.settlement.status === 'success' && detail.expenses.status === 'success') return

    inFlight?.abort()
    const controller = new AbortController()
    detailControllers.set(groupId, controller)

    detail.group.status = 'loading'
    detail.group.error = null
    detail.expenses.status = 'loading'
    detail.expenses.error = null
    detail.settlement.status = 'loading'
    detail.settlement.error = null

    const [groupResult, expensesResult, settlementResult] = await Promise.allSettled([
      fetchGroup(groupId, { signal: controller.signal }),
      fetchExpenses(groupId, { signal: controller.signal }),
      fetchSettlement(groupId, { signal: controller.signal }),
    ])

    if (controller.signal.aborted) return

    if (groupResult.status === 'fulfilled') {
      detail.group = { data: groupResult.value, status: 'success', error: null }
    } else if (!isAbortError(groupResult.reason)) {
      detail.group = { data: null, status: 'error', error: errorMessage(groupResult.reason) }
    }

    if (expensesResult.status === 'fulfilled') {
      detail.expenses = { data: expensesResult.value, status: 'success', error: null }
    } else if (!isAbortError(expensesResult.reason)) {
      detail.expenses = { data: null, status: 'error', error: errorMessage(expensesResult.reason) }
    }

    if (settlementResult.status === 'fulfilled') {
      detail.settlement = { data: settlementResult.value, status: 'success', error: null }
    } else if (!isAbortError(settlementResult.reason)) {
      detail.settlement = {
        data: null,
        status: 'error',
        error: errorMessage(settlementResult.reason),
      }
    }

    if (detailControllers.get(groupId) === controller) detailControllers.delete(groupId)
  }

  /** Re-fetches only the expenses + settlement of a group (after a write). */
  async function refreshGroupData (groupId: string): Promise<void> {
    const detail = detailState(groupId)
    const [expensesResult, settlementResult] = await Promise.allSettled([
      fetchExpenses(groupId),
      fetchSettlement(groupId),
    ])

    if (expensesResult.status === 'fulfilled') {
      detail.expenses = { data: expensesResult.value, status: 'success', error: null }
    }
    if (settlementResult.status === 'fulfilled') {
      detail.settlement = { data: settlementResult.value, status: 'success', error: null }
    }
  }

  // ── Writes ──────────────────────────────────────────────────────────────────

  /**
   * Adds an expense and refreshes the affected group.
   * Errors propagate to the caller so the form can show them inline.
   */
  async function addExpense (groupId: string, draft: ExpenseDraft): Promise<Expense> {
    const expense = await postExpense(groupId, draft)
    await refreshGroupData(groupId)
    return expense
  }

  /**
   * Records a settlement payment and refreshes the affected group.
   * Errors propagate to the caller so the form can show them inline.
   */
  async function addPayment (
    groupId: string,
    payment: Omit<Payment, 'id' | 'createdAt'>,
  ): Promise<Payment> {
    const record = await postPayment(groupId, payment)
    await refreshGroupData(groupId)
    return record
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  /** Cancels the in-flight group list request. */
  function cancelListRequest (): void {
    listController.value?.abort()
    listController.value = null
  }

  /** Cancels the in-flight requests for one group. */
  function cancelGroupRequest (groupId: string): void {
    detailControllers.get(groupId)?.abort()
    detailControllers.delete(groupId)
  }

  /** Cancels every in-flight request (called when leaving the screens). */
  function cancelPendingRequests (): void {
    cancelListRequest()
    detailControllers.forEach(controller => controller.abort())
    detailControllers.clear()
  }

  return {
    groupsState,
    detailState,
    loadGroups,
    createGroup,
    loadGroup,
    refreshGroupData,
    addExpense,
    addPayment,
    cancelListRequest,
    cancelGroupRequest,
    cancelPendingRequests,
  }
})
