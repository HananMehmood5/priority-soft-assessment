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
