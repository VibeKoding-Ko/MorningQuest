export const LEVEL_THRESHOLDS = [
  0, 50, 103, 159, 219, 282, 348, 418, 492, 570,
  652, 738, 828, 923, 1022, 1126, 1234, 1347, 1465, 1588,
  1717, 1851, 1990, 2135, 2286, 2443, 2605, 2774, 2949, 3130,
  3317, 3511, 3712, 3919, 4133, 4354, 4582, 4818, 5061, 5312,
  5570, 5836, 6110, 6392, 6682, 6980, 7286, 7601, 7925, 8257
];

export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getLevelProgress(xp: number) {
  const level = calculateLevel(xp);
  
  if (level >= LEVEL_THRESHOLDS.length) {
    // Max level
    return {
      level,
      currentLevelXp: xp - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1],
      nextLevelXp: 0,
      progressPercent: 100
    };
  }
  
  const currentLevelBaseXp = LEVEL_THRESHOLDS[level - 1];
  const nextLevelBaseXp = LEVEL_THRESHOLDS[level];
  const currentLevelXp = xp - currentLevelBaseXp;
  const nextLevelTotalRequired = nextLevelBaseXp - currentLevelBaseXp;
  const progressPercent = (currentLevelXp / nextLevelTotalRequired) * 100;
  
  return {
    level,
    currentLevelXp,
    nextLevelXp: nextLevelTotalRequired,
    progressPercent
  };
}
