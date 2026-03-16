export type ConstraintError = {
  message: string;
  alternatives?: Array<{ id: string; name: string | null }>;
};

