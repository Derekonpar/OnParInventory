/**
 * Standard location order for all inventory tables
 * This ensures consistent ordering across the entire application
 */
export const LOCATION_ORDER = [
  'Dock Trailer',
  'Event Shelves',
  'Dock Mop Sink',
  'Karaoke',
  'Basement',
  'Unlocked Room Basement',
  'Front Desk',
  'Mop room by dish',
  'Golf',
  'Hallway Storage by ADA bathrooms'
];

/**
 * Get the sort order for a location
 * Returns the index in LOCATION_ORDER, or a large number if not found (sorts to end)
 */
export function getLocationSortOrder(location: string): number {
  const index = LOCATION_ORDER.indexOf(location);
  return index >= 0 ? index : 9999; // Unknown locations go to the end
}

