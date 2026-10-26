/**
 * A date picker's value, as Design system 1's `<ds-calendar picker>` gives it (ISO 8601: a day, or two joined by a
 * slash for a range, with a time on each when Include time is on), read as the days the places need.
 */

/** A picker's value as its first and last day, without times; one day is both. Empty or unreadable is null. */
export function rangeOf(value: string): { from: string; to: string } | null {
  const [first = "", last = first] = value.split("/").map(end => end.slice(0, 10));
  if (!isDay(first) || !isDay(last)) return null;
  return first <= last ? { from: first, to: last } : { from: last, to: first };
}

/** Every day a picker's value covers, first to last. */
export function daysOf(value: string): string[] {
  const range = rangeOf(value);
  if (!range) return [];
  const days: string[] = [];
  for (let day = new Date(`${range.from}T12:00:00Z`); ; day.setUTCDate(day.getUTCDate() + 1)) {
    const iso = day.toISOString().slice(0, 10);
    if (iso > range.to) return days;
    days.push(iso);
  }
}

/** A season as a picker's value: `from/to`, or empty for all year. */
export function seasonValue(season: { from: string; to: string } | null | undefined): string {
  return season ? `${season.from}/${season.to}` : "";
}

const isDay = (text: string) => /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T12:00:00Z`));
