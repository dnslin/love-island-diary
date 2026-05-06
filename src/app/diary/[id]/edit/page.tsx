import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { DiaryForm } from '@/components/DiaryForm';
import { DeleteDiarySection } from '@/components/DeleteDiarySection';
import { getDiaryById } from '@/lib/actions';
import { getAuthRole } from '@/lib/auth';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const entry = await getDiaryById(id);

  return {
    title: entry?.title ? `编辑：${entry.title}` : '编辑日记',
  };
}

export default async function EditDiaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entry, role] = await Promise.all([
    getDiaryById(id),
    getAuthRole(),
  ]);

  if (!entry) {
    notFound();
  }

  if (role !== 'admin') {
    redirect(`/diary/${id}`);
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/diary/${id}`}
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
          <h1 className="text-lg font-bold text-text-main">编辑日记</h1>
        </div>
        <DiaryForm mode="edit" initialData={entry} entryId={id} />
        <DeleteDiarySection entryId={id} />
      </div>
    </main>
  );
}
