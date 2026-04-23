export type CalendarValue = Date | [Date | undefined, Date | undefined] | undefined;

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function sameDay(left?: Date, right?: Date) {
  return Boolean(left && right && startOfDay(left).getTime() === startOfDay(right).getTime());
}

export function sameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function monthMatrix(month: Date, weekStartsOn = 0) {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(firstOfMonth, -offset);

  return Array.from({ length: 6 }, (_, rowIndex) =>
    Array.from({ length: 7 }, (_, columnIndex) => addDays(start, rowIndex * 7 + columnIndex)),
  );
}

export function formatDate(date?: Date) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
