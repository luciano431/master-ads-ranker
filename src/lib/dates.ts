export const PERIODS = [7, 14, 30, 60, 90] as const;
export type Period = (typeof PERIODS)[number];

const iso = (d: Date) => d.toISOString().slice(0, 10);

// Últimos N días completos, sin incluir hoy (el día en curso tiene datos parciales).
export function periodRange(days: Period, now = new Date()) {
  const until = new Date(now);
  until.setUTCDate(until.getUTCDate() - 1);
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  return { since: iso(since), until: iso(until) };
}
