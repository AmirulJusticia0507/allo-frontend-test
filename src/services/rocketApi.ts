/**
 * services/rocketApi.ts
 *
 * Launch Library 2 (v2.2.0) launcher endpoints, with DTO → domain mapping.
 * Docs: https://thespacedevs.com/llapi
 */

import { getJson } from './http'

import type { Rocket, RocketDto, RocketListDto } from '@/types/rocket'

const LAUNCHER_PATH = '/config/launcher/'

/** Prevents `?` / `#` in user input from breaking the filter query. */
function safeFilterValue (value: string): string {
  return value.replace(/[^A-Za-z0-9 ._-]/g, '')
}

function normalise (value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function mapRocketDto (dto: RocketDto): Rocket {
  return {
    id: String(dto.id),
    fullName: normalise(dto.full_name) ?? normalise(dto.name) ?? 'Unnamed rocket',
    description: normalise(dto.description),
    imageUrl: normalise(dto.image_url),
    launchCost: normalise(dto.launch_cost),
    countryCode: normalise(dto.manufacturer?.country_code),
    maidenFlight: normalise(dto.maiden_flight),
    family: normalise(dto.family),
    active: dto.active ?? null,
    manufacturer: dto.manufacturer
      ? { name: normalise(dto.manufacturer.name), country_code: normalise(dto.manufacturer.country_code) }
      : null,
    isCustom: false,
  }
}

/**
 * Fetches every SpaceX rocket in a single request.
 * `mode=detailed` is required for `description` & co., `limit=20` for all 13 rockets.
 */
export async function fetchRockets (
  { manufacturer = 'SpaceX', signal }: { manufacturer?: string, signal?: AbortSignal } = {},
): Promise<Rocket[]> {
  const params = new URLSearchParams({
    manufacturer__name: safeFilterValue(manufacturer),
    mode: 'detailed',
    limit: '20',
  })

  const data = await getJson<RocketListDto>(`${LAUNCHER_PATH}?${params.toString()}`, { signal })
  return (data.results ?? []).map(mapRocketDto)
}

/** Fetches one rocket by its API id. */
export async function fetchRocket (id: string, { signal }: { signal?: AbortSignal } = {}): Promise<Rocket> {
  const dto = await getJson<RocketDto>(`${LAUNCHER_PATH}${encodeURIComponent(id)}/`, { signal })
  return mapRocketDto(dto)
}
