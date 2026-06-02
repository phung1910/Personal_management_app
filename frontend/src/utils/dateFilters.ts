export type TimeFilter = 'today' | 'week' | 'month' | 'all';

export const isWithinFilter = (dateString: string | Date | null | undefined, filter: TimeFilter): boolean => {
  if (!dateString) return false;
  if (filter === 'all') return true;

  const date = new Date(dateString);
  const now = new Date();

  // Reset hours for accurate day comparisons
  const dateStr = date.toISOString().split('T')[0];
  const nowStr = now.toISOString().split('T')[0];

  if (filter === 'today') {
    return dateStr === nowStr;
  }

  if (filter === 'month') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  if (filter === 'week') {
    // Get start of week (Monday)
    const currentDay = now.getDay() || 7; // Convert Sun=0 to Sun=7
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    // End of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
  }

  return true;
};
