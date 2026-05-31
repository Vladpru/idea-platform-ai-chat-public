export function chunkDashboardRows<T>(
  items: T[],
  columnsPerRow: number,
): T[][] {
  if (columnsPerRow < 1 || items.length === 0) {
    return [];
  }

  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += columnsPerRow) {
    rows.push(items.slice(index, index + columnsPerRow));
  }
  return rows;
}
