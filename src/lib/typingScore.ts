export const STAGE_MULTIPLIERS = {
  '기초_1단계_기본자리': 0.6,
  '기초_2단계_윗자리': 0.7,
  '기초_3단계_아랫자리': 0.8,
  '기초_4단계_가운데자리': 0.9,
  '기초_5단계_숫자자리': 1.0,
  '기초_6단계_전체자리': 1.1,
  '단어연습': 1.5,
  '문장연습': 2.0,
  '문단연습': 2.5
};

export type StageKey = keyof typeof STAGE_MULTIPLIERS;

export function getAccuracyMultiplier(accuracy: number): number {
  if (accuracy >= 100) return 2.0;
  if (accuracy >= 98) return 1.6;
  if (accuracy >= 95) return 1.35;
  if (accuracy >= 90) return 1.15;
  if (accuracy >= 80) return 1.0;
  if (accuracy >= 70) return 0.7;
  return 0.4;
}

export function getCpmMultiplier(cpm: number): number {
  if (cpm >= 250) {
    return 2.0 + Math.floor((cpm - 250) / 10) * 0.1;
  }
  if (cpm >= 200) return 1.7;
  if (cpm >= 160) return 1.45;
  if (cpm >= 120) return 1.25;
  if (cpm >= 80) return 1.1;
  if (cpm >= 50) return 1.0;
  return 0.8;
}

export function calculateFinalScore({
  cpm,
  stageMultiplier,
  accuracyMultiplier,
  cpmMultiplier
}: {
  cpm: number;
  stageMultiplier: number;
  accuracyMultiplier: number;
  cpmMultiplier: number;
}) {
  return Math.round(cpm * stageMultiplier * accuracyMultiplier * cpmMultiplier);
}

export function calculateTypingScore({
  targetText,
  inputText,
  elapsedSeconds,
  stageKey
}: {
  targetText: string;
  inputText: string;
  elapsedSeconds: number;
  stageKey: StageKey;
}) {
  const totalChars = targetText.length;
  let correctChars = 0;
  let wrongChars = 0;

  for (let i = 0; i < inputText.length; i++) {
    if (inputText[i] === targetText[i]) {
      correctChars++;
    } else {
      wrongChars++;
    }
  }

  const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;
  const cpm = elapsedSeconds > 0 ? correctChars / (elapsedSeconds / 60) : 0;

  const stageMultiplier = STAGE_MULTIPLIERS[stageKey] ?? 1.0;
  const accuracyMultiplier = getAccuracyMultiplier(accuracy);
  const cpmMultiplier = getCpmMultiplier(cpm);

  const finalScore = calculateFinalScore({
    cpm,
    stageMultiplier,
    accuracyMultiplier,
    cpmMultiplier
  });

  return {
    stageKey,
    totalChars,
    correctChars,
    wrongChars,
    accuracy: Math.round(accuracy),
    cpm: Math.round(cpm),
    stageMultiplier,
    accuracyMultiplier,
    cpmMultiplier,
    finalScore
  };
}

export function calculateTypingScoreFromStats({
  totalChars,
  correctChars,
  wrongChars,
  elapsedSeconds,
  stageKey
}: {
  totalChars: number;
  correctChars: number;
  wrongChars: number;
  elapsedSeconds: number;
  stageKey: StageKey;
}) {
  const actualCorrect = Math.max(0, correctChars - wrongChars);
  const accuracy = totalChars > 0 ? (actualCorrect / totalChars) * 100 : 0;
  const cpm = elapsedSeconds > 0 ? actualCorrect / (elapsedSeconds / 60) : 0;

  const stageMultiplier = STAGE_MULTIPLIERS[stageKey] ?? 1.0;
  const accuracyMultiplier = getAccuracyMultiplier(accuracy);
  const cpmMultiplier = getCpmMultiplier(cpm);

  const finalScore = calculateFinalScore({
    cpm,
    stageMultiplier,
    accuracyMultiplier,
    cpmMultiplier
  });

  return {
    stageKey,
    totalChars,
    correctChars,
    wrongChars,
    accuracy: Math.round(accuracy),
    cpm: Math.round(cpm),
    stageMultiplier,
    accuracyMultiplier,
    cpmMultiplier,
    finalScore
  };
}
