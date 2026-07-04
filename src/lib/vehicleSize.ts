import type { ItemSize, VehicleType } from '../types'

const SIZE_RANK: Record<ItemSize, number> = {
  small: 1,
  medium: 2,
  large: 3,
  extra_large: 4,
}

/** Max item size rank each vehicle type can handle (FR-312). */
const VEHICLE_MAX_RANK: Record<VehicleType, number> = {
  cargo_van: 2,
  small_truck: 3,
  large_truck: 4,
}

export function maxItemSizeRank(items: { size: ItemSize; quantity: number }[]): number {
  if (!items?.length) return 1
  return Math.max(...items.map((i) => SIZE_RANK[i.size] ?? 1))
}

export function vehicleCanHandleJob(vehicleType: VehicleType, items: { size: ItemSize; quantity: number }[]): boolean {
  return maxItemSizeRank(items) <= VEHICLE_MAX_RANK[vehicleType]
}

export function requiredVehicleLabel(rank: number): string {
  if (rank >= 4) return 'Large truck required'
  if (rank >= 3) return 'Small truck+'
  if (rank >= 2) return 'Cargo van+'
  return 'Any vehicle'
}
