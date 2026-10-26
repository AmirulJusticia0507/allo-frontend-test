# Split Bill API — integration contract

Contract between this frontend (`allo-frontend-test`) and the Split Bill backend
in `allo-backend-test/backend` (Node + Express). Everything here was verified by
calling the running service, not copied from the README.

| | |
|---|---|
| Default base URL | `http://localhost:4110` |
| Frontend base URL | `/api` — proxied by the Vite dev server (see `vite.config.mts`) |
| Content type | `application/json` |
| CORS | Wide open (`cors()` default) — only relevant if you bypass the proxy |
| Storage | In memory. **Everything is lost when the backend restarts.** |

Set `VITE_SPLIT_BILL_TARGET` to point the proxy elsewhere. To bypass the proxy
entirely, set `VITE_SPLIT_BILL_BASE_URL=http://localhost:4110/api`.

---

## Money is a string

Every monetary value is a JSON **string** of a decimal, e.g. `"120.50"`.
The backend uses `decimal.js`. Never round-trip a value through `number`
before sending it back: parse for display only (`formatMoney`) and send the
plain decimal string from the form.

## Response shape

All errors use the same shape. The frontend shows `error` verbatim when present.

```json
{ "error": "amount must be positive" }
```

| Status | Meaning |
|---|---|
| 400 | Validation failed (body carries the reason) |
| 404 | Unknown group id |
| 500 | Unhandled backend error (e.g. a non-numeric `amount`) |

---

## `GET /health`

```json
{ "status": "ok", "github": "allobankdev" }
```

Useful to confirm the backend is up before debugging the frontend.

---

## Groups

### `GET /api/groups`

```json
[
  {
    "id": "grp_mvow1bka_tlkrt",
    "name": "Trip",
    "participants": [
      { "id": "p_1", "name": "Alice" },
      { "id": "p_2", "name": "Bob" }
    ]
  }
]
```

### `POST /api/groups`

```json
{ "name": "Trip", "participants": [{ "name": "Alice" }, { "name": "Bob" }] }
```

- `name` and a non-empty `participants` array are required.
- The client sends **names only**; the backend assigns ids `p_1`, `p_2`, … in
  order. ✓ Always read the ids from the response.
- `201` with the created group.

### `GET /api/groups/:id`

`200` with the group, `404` if unknown.

---

## Expenses

### `GET /api/groups/:id/expenses`

Array of expenses, in insertion order:

```json
{
  "id": "exp_mvow1bl2_ub24b",
  "createdAt": "2026-10-26T06:41:00.134Z",
  "amount": "100",
  "paidBy": "p_1",
  "for": ["p_1", "p_2", "p_3"],
  "strategy": "EQUAL",
  "shares": {},
  "category": "general",
  "description": ""
}
```

### `POST /api/groups/:id/expenses`

| Field | Required | Notes |
|---|---|---|
| `amount` | yes | Numeric string, must be `> 0` |
| `paidBy` | yes | Must be a participant id of this group |
| `for` | no | Participant ids; defaults to **all** participants |
| `strategy` | no | `EQUAL` (default) \| `PERCENT` \| `EXACT` |
| `shares` | for `PERCENT`/`EXACT` | `PERCENT`: `{ id: percent }` totalling 100. `EXACT`: `{ id: amount }` totalling `amount`. Strings or numbers. |
| `category` | no | Free text, defaults to `general` |
| `description` | no | Free text |

`201` with the created expense.

---

## Payments

### `POST /api/groups/:id/payments`

```json
{ "from": "p_2", "to": "p_3", "amount": "131.66", "note": "Marked paid from the app" }
```

`201` with the payment. ⚠ Recorded for the audit trail only — see *Known gaps*.

---

## Settlement

### `GET /api/groups/:id/settlement`

```json
{
  "groupId": "grp_mvow1bka_tlkrt",
  "groupName": "Trip",
  "totalExpenses": "220",
  "serviceChargePct": 5,
  "serviceChargeAmount": "11",
  "perParticipant": [
    { "id": "p_1", "name": "Alice", "balance": "6.67" },
    { "id": "p_2", "name": "Bob", "balance": "-138.33" }
  ],
  "transactions": [
    { "from": "p_2", "to": "p_3", "amount": "131.66" }
  ],
  "paymentsApplied": [],
  "totalWithServiceCharge": "231"
}
```

- `perParticipant[].balance` — **positive** means the person is owed money,
  **negative** means they owe. The sum of all balances is `0`.
- `transactions` — the smallest set of transfers the greedy algorithm found.
  `from` pays `to`. Not included in the balances; they are the result of them.
- `serviceChargePct` — `0–9`, derived from the GitHub username in code.
- `paymentsApplied` — recorded payments, echoed back.

---

## Known gaps (as of this integration)

These are backend issues; the frontend works around them but cannot fix them.

1. **Non-numeric `amount` returns `500`.** `POST .../expenses` with
   `{"amount":"abc"}` throws inside `new Decimal()`. The frontend validates the
   field first, so users cannot trigger it, but the API should answer `400`.
2. **`shares` are not validated.** `PERCENT` that does not total 100, or `EXACT`
   that overshoots `amount`, is accepted with `201` and produces nonsense
   balances. The frontend blocks submission until the allocation matches.
3. **Payments do not affect the settlement.** `buildSettlement` never reads
   `payments`. `SettlementSummary.vue` says so explicitly in the UI.
4. **Field naming.** The brief asks for `service_charge_pct` /
   `service_charge_amount`; the API returns `serviceChargePct` /
   `serviceChargeAmount`. If the grader checks the snake_case keys, the backend
   must emit them (the frontend can adapt by aliasing in `splitBillApi.ts`).
5. **Rounding remainder** goes to the last beneficiary in `for`, which can make
   that person's share negative for odd `shares`. Frontend sends the `for` array
   in the order the user selected, so results look fair for equal splits.

## Where the frontend talks to this API

| File | Role |
|---|---|
| `src/config/env.ts` | `SPLIT_BILL_BASE_URL` (`/api` by default) |
| `src/services/splitBillApi.ts` | Thin typed wrappers around each endpoint |
| `src/services/http.ts` | `requestJson` — timeouts, abort, `{ error }` extraction |
| `src/stores/splitBill.ts` | Caches groups + per-group detail, invalidates after writes |
| `src/types/splitBill.ts` | Domain types matching the payloads above |
