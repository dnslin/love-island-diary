import type { Metadata } from 'next';
import { getDiaryList } from '@/lib/actions';
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
  const entries = await getDiaryList();
  const groups = groupByMonth(entries);

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <h1 className="text-lg font-bold text-text-main">目录</h1>
        </div>
        <DiaryTimeline groups={groups} />
      </div>
    </main>
  );
}
