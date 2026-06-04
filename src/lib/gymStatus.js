export const GYM_LOCATIONS = [
  { key: 'zion', name: 'Highway Plaza', detail: '' },
  { key: 'sunplaza', name: 'SunPlaza', detail: '' }
]

export const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: '#22c55e' },
  { value: 'closing_soon', label: 'Closing soon', color: '#f97316' },
  { value: 'closed', label: 'Closed', color: '#ef4444' }
]

export const DEFAULT_GYM_STATUS = {
  message: 'Gym status updated',
  updated_at: null,
  locations: GYM_LOCATIONS.map(location => ({ ...location, status: 'open' }))
}

export function statusMeta(status) {
  return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
}

export function normalizeGymStatus(row) {
  const locations = Array.isArray(row?.locations) ? row.locations : DEFAULT_GYM_STATUS.locations
  return {
    message: row?.message || DEFAULT_GYM_STATUS.message,
    updated_at: row?.updated_at || null,
    locations: GYM_LOCATIONS.map(base => {
      const found = locations.find(l => l.key === base.key)
      return { ...base, status: found?.status || 'open' }
    })
  }
}
