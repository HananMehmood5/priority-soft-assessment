export type Id = string;

export interface ModelAttributes {
  id: Id;
  createdAt: string;
  updatedAt: string;
}

export interface ModelAttributesWithoutUpdatedAt {
  id: Id;
  createdAt: string;
}

// Supported timezones for Coastal Eats locations.
// Initially scoped to the two assessment timezones; extend this list
// if new deployment regions are needed.
export const SUPPORTED_LOCATION_TIMEZONES = [
  'America/Los_Angeles',
  'America/New_York',
] as const;

