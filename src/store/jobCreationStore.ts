import { create } from 'zustand'
import type { JobCreationState, DraftJobItem, TimeWindow, PriceQuote } from '../types'
import { nanoid } from '../lib/nanoid'

interface JobCreationStore extends JobCreationState {
  setAddresses: (data: {
    pickup_address: string
    pickup_lat: number
    pickup_lng: number
    dropoff_address: string
    dropoff_lat: number
    dropoff_lng: number
  }) => void
  setSchedule: (date: string, window: TimeWindow) => void
  setNotes: (notes: string) => void
  addItem: (item: Omit<DraftJobItem, 'id'>) => void
  updateItem: (id: string, data: Partial<DraftJobItem>) => void
  removeItem: (id: string) => void
  setQuote: (quote: PriceQuote) => void
  reset: () => void
}

const initial: JobCreationState = {
  pickup_address: '',
  pickup_lat: 0,
  pickup_lng: 0,
  dropoff_address: '',
  dropoff_lat: 0,
  dropoff_lng: 0,
  scheduled_date: '',
  time_window: '',
  notes: '',
  items: [],
  quote: null,
}

export const useJobCreationStore = create<JobCreationStore>((set) => ({
  ...initial,
  setAddresses: (data) => set(data),
  setSchedule: (scheduled_date, time_window) => set({ scheduled_date, time_window }),
  setNotes: (notes) => set({ notes }),
  addItem: (item) =>
    set((s) => ({ items: [...s.items, { ...item, id: nanoid() }] })),
  updateItem: (id, data) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)) })),
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  setQuote: (quote) => set({ quote }),
  reset: () => set(initial),
}))
