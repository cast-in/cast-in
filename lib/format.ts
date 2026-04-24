export function calculateAge(
  birthDate: string | null,
  now = new Date(),
): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function formatDeadline(iso: string | null) {
  if (!iso) return "상시모집";
  const deadline = new Date(iso);
  return `${deadline.getMonth() + 1}월 ${deadline.getDate()}일 마감`;
}

export function formatDate(iso: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatDeadlineSignal(iso: string | null, now = new Date()) {
  if (!iso) return "상시모집";

  const deadline = new Date(iso);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDeadline = new Date(deadline);
  startOfDeadline.setHours(0, 0, 0, 0);

  const daysLeft = Math.ceil(
    (startOfDeadline.getTime() - startOfToday.getTime()) / 86_400_000,
  );

  if (daysLeft < 0) return "마감";
  if (daysLeft === 0) return "오늘 마감";
  if (daysLeft <= 7) return `D-${daysLeft}`;
  return formatDate(iso);
}
