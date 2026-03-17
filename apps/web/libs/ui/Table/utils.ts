export function getDefaultRowId<T>(row: T): string | number {
  if (row && typeof row === "object" && "id" in row) {
    return (row.id as string | number) ?? String(row);
  }
  return String(row);
}
