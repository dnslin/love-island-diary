import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDiaryById, getDiaryNeighbors, getDiaryList } from '@/lib/actions';
import { PageFlipWrapper } from '@/components/PageFlipWrapper';
import { DiaryDetail } from '@/components/DiaryDetail';

interface DiaryDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DiaryDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getDiaryById(id);
  return { title: entry?.title || '日记详情' };
}

export default async function DiaryDetailPage({ params }: DiaryDetailPageProps) {
  const { id } = await params;
  const [entry, { prev, next }, allEntries] = await Promise.all([
    getDiaryById(id),
    getDiaryNeighbors(id),
    getDiaryList(),
  ]);

  if (!entry) {
    notFound();
  }

  const entryNumber = allEntries.length - allEntries.findIndex((e) => e.id === id);

  return (
    <PageFlipWrapper
      prevId={prev}
      nextId={next}
      currentId={id}
      actions={
        <Link
          href={`/diary/${id}/edit`}
          aria-label="编辑"
          className="text-text-sub hover:text-text-main transition-colors inline-flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </Link>
      }
    >
      <DiaryDetail entry={entry} entryNumber={entryNumber} />
    </PageFlipWrapper>
  );
}
