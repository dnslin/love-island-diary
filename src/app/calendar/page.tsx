import type { Metadata } from 'next';
import Link from 'next/link';
import { getDiaryDatesInMonth } from '@/lib/actions';
import { BackButton } from '@/components/BackButton';
import { CalendarGrid } from '@/components/CalendarGrid';
import dayjs from '@/lib/dayjs';

export const metadata: Metadata = {
  title: '日历',
};

interface CalendarPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const { month } = await searchParams;
  const currentMonth =
    month && /^\d{4}-\d{2}$/.test(month)
      ? dayjs(month, 'YYYY-MM')
      : dayjs();

  const year = currentMonth.year();
  const monthNum = currentMonth.month() + 1;

  const diaryDays = await getDiaryDatesInMonth(year, monthNum);

  const prevMonth = currentMonth.subtract(1, 'month').format('YYYY-MM');
  const nextMonth = currentMonth.add(1, 'month').format('YYYY-MM');
  const monthLabel = currentMonth.format('YYYY年M月');
  const diaryDayCount = diaryDays.length;

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="flex items-center gap-3">
              <Link
                href="/diary"
                className="text-sm text-text-sub hover:text-text-main transition-colors"
              >
                时间线
              </Link>
              <span className="text-border-soft">|</span>
              <span className="text-sm font-bold text-text-main">日历</span>
            </div>
          </div>
          <Link
            href="/memories"
            className="text-sm text-primary hover:text-accent transition-colors"
          >
            照片墙
          </Link>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-text-main">{monthLabel}</h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/calendar?month=${prevMonth}`}
                className="p-1 text-text-sub hover:text-text-main transition-colors"
                aria-label="上一月"
                prefetch
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Link>
              <Link
                href={`/calendar?month=${nextMonth}`}
                className="p-1 text-text-sub hover:text-text-main transition-colors"
                aria-label="下一月"
                prefetch
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>
          </div>
          <p className="text-sm text-text-sub">
            {diaryDayCount > 0
              ? `这个月，我们记录了 ${diaryDayCount} 天。`
              : '这个月还没有记录。'}
          </p>
        </div>

        <CalendarGrid year={year} month={monthNum} diaryDays={diaryDays} />
      </div>
    </main>
  );
}
