/**
 * types/rocket.ts
 *
 * Domain model for rockets shown in the app.
 *
 * Every display field is nullable because the Launch Library 2 API returns
 * `null` for some of them (e.g. `launch_cost`, `maiden_flight`, `image_url`).
 */

export interface RocketManufacturer {
  name: string | null
  country_code: string | null
}

export interface Rocket {
  /** Unique key for the list. API rockets use the API id, user rockets use a local id. */
  id: string
  fullName: string
  description: string | null
  imageUrl: string | null
  /** Raw value from the API (string), kept as-is and formatted on display. */
  launchCost: string | null
  countryCode: string | null
  /** ISO date, e.g. `2018-05-11`. */
  maidenFlight: string | null
  family: string | null
  active: boolean | null
  manufacturer: RocketManufacturer | null
  /** `true` for rockets created from the "Add rocket" form (API is read-only). */
  isCustom: boolean
}

/** Payload of the "Add rocket" form, before being turned into a {@link Rocket}. */
export interface RocketDraft {
  fullName: string
  description: string | null
  imageUrl: string | null
  launchCost: string | null
  countryCode: string | null
  maidenFlight: string | null
}

/** Raw shape of a launcher from `/2.2.0/config/launcher/?mode=detailed`. */
export interface RocketDto {
  id: number
  full_name: string | null
  name: string | null
  description: string | null
  image_url: string | null
  launch_cost: string | null
  family: string | null
  active: boolean | null
  maiden_flight: string | null
  manufacturer: {
    name: string | null
    country_code: string | null
  } | null
}

export interface RocketListDto {
  count: number
  next: string | null
  previous: string | null
  results: RocketDto[]
}
