/**
 * Expense dates are stored as "M/D/YY" or "MM/DD/YY". Parse to Date at start of day (local).
 * Returns null if the string is empty or invalid.
 */
export function parseExpenseDate(dateStr: string): Date | null {
  const s = dateStr?.trim() ?? '';
  if (!s) return null;
  const parts = s.split('/').map((p) => p.trim());
  if (parts.length !== 3) return null;
  const month = parseInt(parts[0], 10) - 1;
  const day = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(year)) return null;
  if (year < 100) year += 2000; // 26 -> 2026
  const d = new Date(year, month, day);
  if (Number.isNaN(d.getTime()) || d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
    return null;
  }
  return d;
}

/** Start of day (00:00:00) for the given date. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Default report range: from (today - 1 month) to today (inclusive). */
export function defaultReportRange(): { start: Date; end: Date } {
  const end = startOfDay(new Date());
  const start = new Date(end);
  start.setMonth(start.getMonth() - 1);
  return { start, end };
}

/** Whether a parsed expense date falls within [start, end] (inclusive, date-only). */
export function isInRange(expenseDate: Date | null, start: Date, end: Date): boolean {
  if (!expenseDate) return false;
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  const t = startOfDay(expenseDate).getTime();
  return t >= s && t <= e;
}

/** Format Date as YYYY-MM-DD for input[type="date"]. */
export function toInputDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD string to Date (start of day). */
export function fromInputDateString(s: string): Date | null {
  if (!s?.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}
