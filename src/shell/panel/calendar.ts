// Takvim ızgarası hesabı: bir ayın günlerini pazartesiden başlayan haftalara dizer.
// Ayın başındaki/sonundaki boş hücreler null olur.
export function monthGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // Pazartesi = 0
  const cells: (number | null)[] = Array.from({ length: offset }, () => null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Pazartesiden başlayarak kısa gün adları (dile göre) */
export function weekdayNames(locale: string): string[] {
  // 2024-01-01 bir pazartesidir
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }),
  );
}
