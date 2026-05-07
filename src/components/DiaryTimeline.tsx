import Link from 'next/link'
import { Button } from 'animal-island-ui'
import dayjs from '@/lib/dayjs'
import type { DiaryEntry, DiaryImage } from '@prisma/client'
import { StaggerContainer, StaggerItem } from './animations'
import { EmptyState } from './illustrations'

interface DiaryTimelineProps {
  groups: Map<string, Array<DiaryEntry & { images: DiaryImage[] }>>;
  showWriteButton?: boolean;
}

function defaultTitle(date: Date): string {
  return `${dayjs(date).format('YYYY年M月D日')} 的心情`;
}

export function DiaryTimeline({ groups, showWriteButton = false }: DiaryTimelineProps) {
  if (groups.size === 0) {
    return (
      <EmptyState>
        {showWriteButton && (
          <div className="mt-4">
            <Link href="/diary/new">
              <Button type="primary">写下第一篇</Button>
            </Link>
          </div>
        )}
      </EmptyState>
    )
  }

  return (
    <StaggerContainer className="space-y-6">
      {Array.from(groups.entries()).map(([monthKey, entries]) => (
        <StaggerItem key={monthKey}>
          <section className="relative pl-6">
            <h2 className="sticky top-0 bg-cream/95 backdrop-blur z-10 py-2 text-sm font-bold text-text-main">
              {(() => {
                const [year, month] = monthKey.split('-');
                return `${year} 年 ${parseInt(month, 10)} 月`;
              })()}
            </h2>
            <div className="absolute left-[7px] top-10 bottom-0 w-px bg-border-soft" />
            <StaggerContainer className="space-y-3 py-2">
              {entries.map((entry) => (
                <StaggerItem key={entry.id}>
                  <li className="relative">
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
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}
