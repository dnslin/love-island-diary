import type { Metadata } from 'next';
import Link from 'next/link';
import { getDiaryList } from '@/lib/actions';
import { getAuthRole } from '@/lib/auth';
import { DiaryTimeline } from '@/components/DiaryTimeline';
import { BackButton } from '@/components/BackButton';
import dayjs from '@/lib/dayjs';
import type { DiaryEntry, DiaryImage } from '@prisma/client';

export const metadata: Metadata = {
  title: '目录',
};

type Entry = DiaryEntry & { images: DiaryImage[] };

function groupByMonth(entries: Entry[]) {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const key = dayjs(entry.date).format('YYYY-MM');
    const arr = groups.get(key);
    if (arr) {
      arr.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }
  return groups;
}

export default async function DiaryPage() {
  const [entries, role] = await Promise.all([
    getDiaryList(),
    getAuthRole(),
  ]);
  const groups = groupByMonth(entries);

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-text-main">时间线</span>
              <span className="text-border-soft">|</span>
              <Link
                href="/calendar"
                className="text-sm text-text-sub hover:text-text-main transition-colors"
              >
                日历
              </Link>
            </div>
          </div>
          <Link
            href="/memories"
            className="text-sm text-primary hover:text-accent transition-colors"
          >
            照片墙
          </Link>
        </div>
        <DiaryTimeline groups={groups} showWriteButton={role === 'admin'} />
      </div>
    </main>
  );
}
