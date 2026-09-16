export const getTodayDateString = (rolloverHour: number = 0): string => {
  const d = new Date();
  if (d.getHours() < rolloverHour) {
    d.setDate(d.getDate() - 1);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatShortDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const formatWeekRange = (startDateStr: string, endDateStr: string): string => {
  if (!startDateStr || !endDateStr) return '';
  const [sY, sM, sD] = startDateStr.split('-').map(Number);
  const [eY, eM, eD] = endDateStr.split('-').map(Number);
  const sDate = new Date(sY, sM - 1, sD);
  const eDate = new Date(eY, eM - 1, eD);

  const startMonth = sDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = eDate.toLocaleDateString('en-US', { month: 'short' });

  if (sY === eY) {
    if (sM === eM) {
      return `${startMonth} ${sD} – ${eD}, ${sY}`;
    }
    return `${startMonth} ${sD} – ${endMonth} ${eD}, ${sY}`;
  }
  return `${startMonth} ${sD}, ${sY} – ${endMonth} ${eD}, ${eY}`;
};

export const formatWeekRangeShort = (startDateStr: string, endDateStr: string): string => {
  if (!startDateStr || !endDateStr) return '';
  const [sY, sM, sD] = startDateStr.split('-').map(Number);
  const [eY, eM, eD] = endDateStr.split('-').map(Number);
  const sDate = new Date(sY, sM - 1, sD);
  const eDate = new Date(eY, eM - 1, eD);

  const startMonth = sDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = eDate.toLocaleDateString('en-US', { month: 'short' });

  if (sM === eM) {
    return `${startMonth} ${sD} – ${eD}`;
  }
  return `${startMonth} ${sD} – ${endMonth} ${eD}`;
};

export const getDayOfWeekName = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

// ISO Week calculation or Monday/Sunday anchored week
export const getWeekInfo = (dateStr: string, weekStartsOn: 0 | 1 = 1) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);

  const dayOfWeek = targetDate.getDay(); // 0 is Sun, 1 is Mon
  const diffToStart = (dayOfWeek - weekStartsOn + 7) % 7;
  const startDate = new Date(targetDate);
  startDate.setDate(targetDate.getDate() - diffToStart);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${da}`);
  }

  // Week number calculation
  const startOfYear = new Date(startDate.getFullYear(), 0, 1);
  const pastDaysOfYear = (startDate.getTime() - startOfYear.getTime()) / 86400000;
  const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

  const weekId = `${startDate.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

  return {
    weekId,
    weekNumber: weekNum,
    year: startDate.getFullYear(),
    startDate: days[0],
    endDate: days[6],
    days,
  };
};

export const getMonthInfo = (dateStr: string) => {
  const [year, month] = dateStr.split('-').map(Number);
  const monthId = `${year}-${String(month).padStart(2, '0')}`;
  const firstDay = new Date(year, month - 1, 1);
  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const totalDays = new Date(year, month, 0).getDate();

  const days: string[] = [];
  for (let i = 1; i <= totalDays; i++) {
    days.push(`${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
  }

  return {
    monthId,
    monthName,
    year,
    monthNumber: month,
    days,
    totalDays,
  };
};

export const getScoreStatus = (
  score: number,
  totalGoals: number = 1
): {
  status: 'EXCELLENT' | 'PROGRESS' | 'RECOVERY' | 'IDLE';
  label: string;
  colorClass: string;
  badgeBg: string;
  borderClass: string;
  accentClass: string;
  subtext: string;
} => {
  if (totalGoals === 0) {
    return {
      status: 'IDLE',
      label: 'READY — Add Goals to Start',
      colorClass: 'text-slate-600',
      badgeBg: 'bg-slate-500 text-white',
      borderClass: 'border-slate-300',
      accentClass: 'bg-slate-400',
      subtext: 'Configure your active targets to begin daily tracking.',
    };
  }

  if (score >= 90) {
    return {
      status: 'EXCELLENT',
      label: 'GREEN — Excellent Consistency',
      colorClass: 'text-emerald-400',
      badgeBg: 'bg-emerald-500 text-white',
      borderClass: 'border-emerald-300',
      accentClass: 'bg-emerald-500',
      subtext: 'High performance day. Consistency compound unlocked.',
    };
  }
  if (score >= 70) {
    return {
      status: 'PROGRESS',
      label: 'YELLOW — Good Progress',
      colorClass: 'text-amber-400',
      badgeBg: 'bg-amber-500 text-white',
      borderClass: 'border-amber-300',
      accentClass: 'bg-amber-500',
      subtext: 'Solid execution. Close the remaining gaps today.',
    };
  }
  return {
    status: 'RECOVERY',
    label: 'RED — Recovery Required',
    colorClass: 'text-rose-400',
    badgeBg: 'bg-rose-500 text-white',
    borderClass: 'border-rose-300',
    accentClass: 'bg-rose-500',
    subtext: 'Do not recover the lost days. Recover today.',
  };
};

/**
 * Formats a 24-hour time string ("HH:mm" or "H:mm") into 12-hour Indian format
 * e.g., "06:30" -> "06:30 AM", "14:00" -> "02:00 PM", "22:00" -> "10:00 PM"
 */
export const formatTime12Hour = (timeStr?: string, padHours: boolean = true): string => {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return timeStr;

  const rawHours = parseInt(parts[0], 10);
  const rawMinutes = parseInt(parts[1], 10);
  if (isNaN(rawHours) || isNaN(rawMinutes)) return timeStr;

  const period = rawHours >= 12 ? 'PM' : 'AM';
  let hours12 = rawHours % 12;
  if (hours12 === 0) hours12 = 12;

  const hoursDisplay = padHours ? String(hours12).padStart(2, '0') : String(hours12);
  const minutesDisplay = String(rawMinutes).padStart(2, '0');

  return `${hoursDisplay}:${minutesDisplay} ${period}`;
};
