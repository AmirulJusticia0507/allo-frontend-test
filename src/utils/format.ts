/**
 * utils/format.ts
 *
 * Display helpers that tolerate missing (null) API values.
 */

export const NOT_AVAILABLE = 'Not available'

/** `2018-05-11` → `11 May 2018` (falls back to the raw value if unparsable). */
export function formatDate (value: string | null | undefined): string {
  if (!value) return NOT_AVAILABLE

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** `"52000000"` → `$52,000,000`. Handles already-formatted values gracefully. */
export function formatCost (value: string | null | undefined): string {
  if (!value) return NOT_AVAILABLE

  const numeric = Number(value.replace(/,/g, '').trim())
  if (!Number.isFinite(numeric)) return value

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(numeric)
}

/** `USA` → `USA · United States`, using the browser's region names. */
export function formatCountry (code: string | null | undefined): string {
  if (!code) return NOT_AVAILABLE

  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
    const name = regionNames.of(code)
    return name && name !== code ? `${code} · ${name}` : code
  } catch {
    return code
  }
}

/** Shortens long text for list cards without breaking words. */
export function truncate (value: string | null | undefined, maxLength = 160): string {
  if (!value) return ''
  if (value.length <= maxLength) return value

  const cut = value.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`
}

/**
 * Formats a decimal string from the Split Bill API as currency.
 *
 * Parsing to `number` is safe *for display only*: the backend already did the
 * exact `decimal.js` arithmetic, and `Intl` rounds to at most 2 decimals.
 * Never send a formatted value back to the API.
 */
export function formatMoney (value: string | null | undefined, currency = 'IDR'): string {
  if (value == null || value === '') return NOT_AVAILABLE

  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric)
}

/**
 * Formats a signed balance: `+66.67` / `-33.33` → `+$66.67` / `-$33.33`.
 * The sign is kept because it carries the meaning (owed vs. owes).
 */
export function formatSignedMoney (value: string | null | undefined, currency = 'IDR'): string {
  if (value == null || value === '') return NOT_AVAILABLE

  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  if (numeric === 0) return formatMoney('0', currency)

  const formatted = formatMoney(String(Math.abs(numeric)), currency)
  return numeric > 0 ? `+${formatted}` : `-${formatted}`
}

/** Resolves a participant id to a display name, tolerating unknown ids. */
export function participantName (
  participants: ReadonlyArray<{ id: string, name: string }>,
  id: string,
): string {
  return participants.find(participant => participant.id === id)?.name ?? id
}

