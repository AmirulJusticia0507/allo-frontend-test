/**
 * types/splitBill.ts
 *
 * Domain model for the Split Bill API served by the backend in
 * `C:\laragon\www\allo-backend-test\backend` (Node + Express, port 4110).
 * The wire contract is documented in `docs/split-bill-api.md`.
 *
 * Money is always transmitted as a string (e.g. `"33.34"`) because the
 * backend computes with `decimal.js`; converting to `number` in the browser
 * would reintroduce the floating-point errors the API exists to avoid.
 */

export type SplitStrategy = 'EQUAL' | 'PERCENT' | 'EXACT'

export interface Participant {
  id: string
  name: string
}

export interface BillGroup {
  id: string
  name: string
  participants: Participant[]
}

export interface Expense {
  id: string
  /** ISO timestamp assigned by the backend. */
  createdAt: string
  /** Decimal string, e.g. `"120.50"`. */
  amount: string
  /** Participant id of the person who paid. */
  paidBy: string
  /** Participant ids the expense is split between. */
  for: string[]
  strategy: SplitStrategy
  /**
   * `PERCENT`: `{ [participantId]: percent }`, summing to 100.
   * `EXACT`: `{ [participantId]: amount }`, summing to `amount`.
   * Empty for `EQUAL`.
   */
  shares: Record<string, string | number>
  category: string
  description: string
}

export interface Payment {
  id: string
  createdAt: string
  /** Payer (the debtor). */
  from: string
  /** Payee (the creditor). */
  to: string
  amount: string
  note: string
}

export interface ParticipantBalance {
  id: string
  name: string
  /** Positive → is owed money. Negative → owes money. */
  balance: string
}

export interface Transaction {
  from: string
  to: string
  amount: string
}

export interface Settlement {
  groupId: string
  groupName: string
  /** Sum of every expense in the group. */
  totalExpenses: string
  /** 0–9. Derived from the GitHub username, never hardcoded. */
  serviceChargePct: number
  serviceChargeAmount: string
  perParticipant: ParticipantBalance[]
  transactions: Transaction[]
  paymentsApplied: Payment[]
  /** `totalExpenses + serviceChargeAmount`. */
  totalWithServiceCharge: string
}

/** Payload of the "Create group" form. */
export interface GroupDraft {
  name: string
  /** Names only — the backend generates the participant ids. */
  participants: string[]
}

/** Payload of the "Add expense" form. */
export interface ExpenseDraft {
  amount: string
  paidBy: string
  for: string[]
  strategy: SplitStrategy
  shares: Record<string, string>
  category: string
  description: string
}

/** Error body returned by the backend for 4xx/5xx responses. */
export interface ApiErrorBody {
  error: string
}
