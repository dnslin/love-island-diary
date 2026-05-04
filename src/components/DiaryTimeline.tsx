import Link from 'next/link';
import { Button } from 'animal-island-ui';
import dayjs from '@/lib/dayjs';
import type { DiaryEntry, DiaryImage } from '@prisma/client';

interface DiaryTimelineProps {
  groups: Map<string, Array<DiaryEntry & { images: DiaryImage[] }>>;
}

function defaultTitle(date: Date): string {
  return `${dayjs(date).format('YYYY年M月D日')} 的心情`;
}

export function DiaryTimeline({ groups }: DiaryTimelineProps) {
  if (groups.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-sub"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
        <p className="mt-3 text-sm text-text-sub">
          还没有日记呢，翻开第一页吧
        </p>
        <div className="mt-4">
          <Link href="/diary/new">
            <Button type="primary">写下第一篇</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([monthKey, entries]) => (
        <section key={monthKey} className="relative pl-6">
          <h2 className="sticky top-0 bg-cream/95 backdrop-blur z-10 py-2 text-sm font-bold text-text-main">
            {(() => {
              const [year, month] = monthKey.split('-');
              return `${year} 年 ${parseInt(month, 10)} 月`;
            })()}
          </h2>
          <div className="absolute left-[7px] top-10 bottom-0 w-px bg-border-soft" />
          <ul className="space-y-3 py-2">
            {entries.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute left-[-22px] top-2 w-3 h-3 rounded-full bg-primary" />
                <Link
                  href={`/diary/${entry.id}`}
                  className="block hover:bg-card/60 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="text-xs text-text-sub">
                    {dayjs(entry.date).format('M月D日 dddd')}
                  </div>
                  <div className="text-base text-text-main">
                    {entry.title || defaultTitle(entry.date)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
