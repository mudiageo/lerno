// Centralised XP level progression — used by xp-badge, right-panel, study session summaries, etc.
export const XP_LEVELS = [
  { level: 1, xp: 0, title: 'Fresher' },
  { level: 2, xp: 100, title: 'Scholar' },
  { level: 3, xp: 300, title: 'Analyst' },
  { level: 4, xp: 600, title: 'Researcher' },
  { level: 5, xp: 1000, title: 'Expert' },
  { level: 6, xp: 1500, title: "Dean's List" },
  { level: 7, xp: 2500, title: 'Honours' },
  { level: 8, xp: 4000, title: 'First Class' },
  { level: 9, xp: 6000, title: 'Valedictorian' },
  { level: 10, xp: 10000, title: 'Legend' },
] as const;

export type XpLevel = (typeof XP_LEVELS)[number];

export function getXpLevel(xp: number): XpLevel {
  return [...XP_LEVELS].reverse().find(l => l.xp <= xp) ?? XP_LEVELS[0];
}

export function getNextXpLevel(xp: number): XpLevel | undefined {
  return XP_LEVELS.find(l => l.xp > xp);
}

export function getXpProgress(xp: number): number {
  const current = getXpLevel(xp);
  const next = getNextXpLevel(xp);
  if (!next) return 100;
  return ((xp - current.xp) / (next.xp - current.xp)) * 100;
}
