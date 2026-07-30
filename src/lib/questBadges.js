import moment from 'moment';

// ── Badge definitions ───────────────────────────────────────────────────────
// Each badge is earned from quest-completion stats. `check` receives the
// computed stats object and returns true when the badge is earned.
export const BADGE_DEFINITIONS = [
  {
    key: 'first-quest',
    title: 'First Steps',
    description: 'Completed your first quest',
    icon: 'Sparkles',
    color: 'from-cyan-500 to-blue-500',
    check: (s) => s.totalCompleted >= 1,
  },
  {
    key: 'streak-3',
    title: 'Consistent',
    description: '3-day quest streak',
    icon: 'Flame',
    color: 'from-orange-500 to-amber-500',
    check: (s) => s.maxStreak >= 3,
  },
  {
    key: 'active-5',
    title: 'Explorer',
    description: '5 active days of questing',
    icon: 'Compass',
    color: 'from-emerald-500 to-teal-500',
    check: (s) => s.activeDays >= 5,
  },
  {
    key: 'streak-7',
    title: 'On Fire',
    description: '7-day quest streak',
    icon: 'Flame',
    color: 'from-red-500 to-orange-500',
    check: (s) => s.maxStreak >= 7,
  },
  {
    key: 'quests-10',
    title: 'Quest Seeker',
    description: 'Completed 10 quests',
    icon: 'Target',
    color: 'from-fuchsia-500 to-purple-500',
    check: (s) => s.totalCompleted >= 10,
  },
  {
    key: 'streak-14',
    title: 'Devoted',
    description: '14-day quest streak',
    icon: 'Flame',
    color: 'from-pink-500 to-rose-500',
    check: (s) => s.maxStreak >= 14,
  },
  {
    key: 'active-15',
    title: 'Dedicated',
    description: '15 active days of questing',
    icon: 'Calendar',
    color: 'from-indigo-500 to-blue-500',
    check: (s) => s.activeDays >= 15,
  },
  {
    key: 'quests-50',
    title: 'Quest Conqueror',
    description: 'Completed 50 quests',
    icon: 'Trophy',
    color: 'from-amber-500 to-yellow-500',
    check: (s) => s.totalCompleted >= 50,
  },
  {
    key: 'streak-30',
    title: 'Unbreakable',
    description: '30-day quest streak',
    icon: 'Crown',
    color: 'from-violet-500 to-fuchsia-500',
    check: (s) => s.maxStreak >= 30,
  },
  {
    key: 'quests-100',
    title: 'Centurion',
    description: 'Completed 100 quests',
    icon: 'Crown',
    color: 'from-yellow-400 to-amber-500',
    check: (s) => s.totalCompleted >= 100,
  },
];

// ── Stats computation ──────────────────────────────────────────────────────
// Derives quest achievement stats from an array of QuestProgress records.
export function computeQuestStats(records) {
  const completed = (records || []).filter((r) => r.completed);
  const totalCompleted = completed.length;
  const uniqueDates = [...new Set(completed.map((r) => r.date))].sort();
  const activeDays = uniqueDates.length;

  // Longest run of consecutive calendar days
  let maxStreak = 0;
  let currentRun = 0;
  let prev = null;
  for (const d of uniqueDates) {
    const m = moment.utc(d);
    if (prev && m.diff(prev, 'days') === 1) {
      currentRun += 1;
    } else {
      currentRun = 1;
    }
    maxStreak = Math.max(maxStreak, currentRun);
    prev = m;
  }

  // Current streak (ending today or yesterday)
  const today = moment.utc().format('YYYY-MM-DD');
  const dateSet = new Set(uniqueDates);
  let currentStreak = 0;
  let cursor = moment.utc(today);
  if (!dateSet.has(cursor.format('YYYY-MM-DD'))) {
    cursor = cursor.subtract(1, 'day');
  }
  while (dateSet.has(cursor.format('YYYY-MM-DD'))) {
    currentStreak += 1;
    cursor = cursor.subtract(1, 'day');
  }

  return { totalCompleted, activeDays, maxStreak, currentStreak };
}

// Returns the subset of BADGE_DEFINITIONS the user has earned.
export function getEarnedBadges(records) {
  const stats = computeQuestStats(records);
  return BADGE_DEFINITIONS.filter((b) => b.check(stats));
}