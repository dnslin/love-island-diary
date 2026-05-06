import type { Metadata } from 'next';
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
    <PageFlipWrapper prevId={prev} nextId={next} currentId={id}>
      <DiaryDetail entry={entry} entryNumber={entryNumber} />
    </PageFlipWrapper>
  );
}
