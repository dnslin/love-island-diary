import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDiaryById } from '@/lib/actions';
import { DiaryDetail } from '@/components/DiaryDetail';

interface DiaryDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DiaryDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getDiaryById(id);
  return {
    title: entry?.title || '日记详情',
  };
}

export default async function DiaryDetailPage({
  params,
}: DiaryDetailPageProps) {
  const { id } = await params;
  const entry = await getDiaryById(id);

  if (!entry) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/diary/new"
            className="text-text-sub hover:text-text-main transition-colors"
            aria-label="返回"
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
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-text-main">日记详情</h1>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <DiaryDetail entry={entry} />
        </div>
        <div className="mt-6 flex justify-center">
          <Link
            href="/diary"
            className="inline-flex items-center gap-2 text-sm text-text-sub hover:text-text-main transition-colors"
            aria-label="返回时间线"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="21" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="21" y1="18" x2="3" y2="18" />
            </svg>
            时间线
          </Link>
        </div>
      </div>
    </main>
  );
}
