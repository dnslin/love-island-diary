interface CalendarGridProps {
  year: number;
  month: number;
  diaryDays: Array<{
    date: string;
    entries: Array<{ id: string; title: string | null }>;
  }>;
}

export function CalendarGrid(_props: CalendarGridProps) {
  return null;
}
