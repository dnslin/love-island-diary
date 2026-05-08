'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from '@/lib/dayjs';
import { StaggerContainer, StaggerItem } from './animations';
import { DayEntriesModal } from './DayEntriesModal';

interface DiaryDay {
  date: string;
  entries: Array<{ id: string; title: string | null }>;
}

interface CalendarGridProps {
  year: number;
  month: number;
  diaryDays: DiaryDay[];
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function CalendarGrid({ year, month, diaryDays }: CalendarGridProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<DiaryDay['entries']>([]);

  const diaryMap = new Map(diaryDays.map((d) => [d.date, d.entries]));

  const firstDayOfMonth = dayjs().year(year).month(month - 1).startOf('month');
  const daysInMonth = firstDayOfMonth.daysInMonth();
  const startWeekday = firstDayOfMonth.day();

  const today = dayjs().format('YYYY-MM-DD');

  const days: Array<{
    day: number;
    dateStr: string | null;
    isCurrentMonth: boolean;
  }> = [];

  const prevMonthDays = firstDayOfMonth.subtract(startWeekday, 'day');
  for (let i = 0; i < startWeekday; i++) {
    const d = prevMonthDays.add(i, 'day');
    days.push({
      day: d.date(),
      dateStr: d.format('YYYY-MM-DD'),
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = firstDayOfMonth.date(i);
    days.push({
      day: i,
      dateStr: d.format('YYYY-MM-DD'),
      isCurrentMonth: true,
    });
  }

  const totalCells = days.length <= 35 ? 35 : 42;
  const remaining = totalCells - days.length;
  const nextMonthStart = firstDayOfMonth.add(1, 'month').startOf('month');
  for (let i = 0; i < remaining; i++) {
    const d = nextMonthStart.add(i, 'day');
    days.push({
      day: d.date(),
      dateStr: d.format('YYYY-MM-DD'),
      isCurrentMonth: false,
    });
  }

  const handleDayClick = (dateStr: string, entries: DiaryDay['entries']) => {
    if (entries.length === 1) {
      router.push(`/diary/${entries[0].id}`);
    } else if (entries.length > 1) {
      setSelectedDate(dateStr);
      setSelectedEntries(entries);
    }
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
    setSelectedEntries([]);
  };

  return (
    <>
      <StaggerContainer className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <StaggerItem key={wd}>
            <div className="text-center text-xs text-text-sub py-2">{wd}</div>
          </StaggerItem>
        ))}
        {days.map(({ day, dateStr, isCurrentMonth }, idx) => {
          const entries = dateStr ? diaryMap.get(dateStr) ?? [] : [];
          const hasDiary = entries.length > 0;
          const isToday = dateStr === today;

          return (
            <StaggerItem key={idx}>
              <button
                type="button"
                onClick={() => dateStr && handleDayClick(dateStr, entries)}
                disabled={!hasDiary}
                className={[
                  'w-full aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors',
                  isCurrentMonth ? 'text-text-main' : 'text-text-sub/40',
                  isToday ? 'ring-2 ring-primary/50' : '',
                  hasDiary
                    ? 'cursor-pointer hover:bg-card'
                    : 'cursor-default',
                  !isCurrentMonth && !hasDiary
                    ? 'pointer-events-none'
                    : '',
                ].join(' ')}
              >
                <span className="text-sm">{day}</span>
                {hasDiary && (
                  <span
                    data-testid="diary-dot"
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </button>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <DayEntriesModal
        open={selectedDate !== null}
        date={selectedDate ?? ''}
        entries={selectedEntries}
        onClose={handleCloseModal}
      />
    </>
  );
}
