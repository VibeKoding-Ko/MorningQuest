export function formatDateToKSTString(date: Date): string {
  // Use Asia/Seoul timezone to ensure consistent "today" for Korean students
  // Korea Standard Time is UTC + 9 hours
  const kstTime = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstTime.toISOString().split('T')[0];
}

export function getTodayDateString(): string {
  return formatDateToKSTString(new Date());
}
