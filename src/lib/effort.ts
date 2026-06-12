import type { ItemSize } from '@/types/database'

const SIZE_WEIGHT: Record<ItemSize, number> = {
  small: 0,
  medium: 10,
  large: 25,
  extra_large: 40,
}

/**
 * Calculates an effort score (0–100) and a human-readable effort label.
 * Score is based on distance, estimated duration, and item size.
 */
export function calculateEffortScore(
  distanceKm: number,
  durationMin: number,
  itemSize: ItemSize
): number {
  const distanceComponent = Math.min(distanceKm * 2, 40)
  const timeComponent = Math.min(durationMin * 0.5, 20)
  const sizeComponent = SIZE_WEIGHT[itemSize]
  const raw = distanceComponent + timeComponent + sizeComponent
  return Math.min(Math.round(raw), 100)
}

export function effortLabel(score: number): string {
  if (score < 20) return 'Light'
  if (score < 45) return 'Moderate'
  if (score < 70) return 'Challenging'
  return 'Heavy'
}

export function effortColor(score: number): string {
  if (score < 20) return 'text-green-600 bg-green-50'
  if (score < 45) return 'text-yellow-600 bg-yellow-50'
  if (score < 70) return 'text-orange-600 bg-orange-50'
  return 'text-red-600 bg-red-50'
}

/** Rough community value equivalent — NOT a price, purely informational */
export function estimatedValue(distanceKm: number, itemSize: ItemSize): number {
  const base = 10
  const distancePart = distanceKm * 1.5
  const sizePart = SIZE_WEIGHT[itemSize] * 0.5
  return Math.round(base + distancePart + sizePart)
}
