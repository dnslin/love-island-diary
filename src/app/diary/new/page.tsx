import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DiaryForm } from '@/components/DiaryForm';
import { getAuthRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '写下今天',
};

export default async function NewDiaryPage() {
  const role = await getAuthRole();

  if (role !== 'admin') {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/"
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
          <h1 className="text-lg font-bold text-text-main">写下今天</h1>
        </div>
        <DiaryForm />
      </div>
    </main>
  );
}
