import type { Metadata } from 'next';
import Link from 'next/link';
import dayjs from 'dayjs';
import { getAuthRole } from '@/lib/auth';
import { getCoupleProfile, getCoverStats, getDiaryList } from '@/lib/actions';
import CoverLogo from '@/components/CoverLogo';
import AnimatedDays from '@/components/AnimatedDays';
import CoverActions from '@/components/CoverActions';
import AdminAuthTrigger from '@/components/AdminAuthTrigger';
import { CoverDecorations } from '@/components/illustrations';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getCoupleProfile();
  return {
    title: profile?.siteTitle ?? '恋爱小岛日记',
  };
}

export default async function Home() {
  const [profile, stats, diaries, role] = await Promise.all([
    getCoupleProfile(),
    getCoverStats(),
    getDiaryList(),
    getAuthRole(),
  ]);

  const latestDiary = diaries[0] ?? null;

  // layout 守卫已确保 profile 存在;保留类型收窄
  if (!profile) {
    return null;
  }

  const days = dayjs().diff(dayjs(profile.anniversaryDate), 'day');
  const formattedDate = dayjs(profile.anniversaryDate).format('YYYY.MM.DD');

  return (
    <div className="min-h-screen bg-cream px-4 relative overflow-x-hidden">
      <div className="mx-auto max-w-[480px] min-h-screen relative">
        {/* 设置按钮 — 仅 admin 可见 */}
        {role === 'admin' && (
          <Link
            href="/settings"
            className="absolute top-4 right-0 p-2 text-text-sub hover:text-text-main transition-colors"
            aria-label="设置"
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
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        )}

        {/* Logo */}
        <div className="absolute top-14 left-2">
          <CoverLogo />
        </div>

        {/* 标题 */}
        <div className="absolute top-16 left-16 text-[10px] text-text-sub tracking-[3px]">
          {profile.siteTitle ?? '恋爱小岛日记'}
        </div>

        {/* 昵称卡片 */}
        <div className="absolute top-30 left-2 -rotate-2">
          <div className="bg-card border border-border-soft rounded-xl px-5 py-3 shadow-sm">
            <div className="text-[15px] font-bold text-text-main">
              {profile.personAName}{' '}
              <span className="text-accent">&</span>{' '}
              {profile.personBName}
            </div>
            <div className="text-[9px] text-text-sub mt-1">
              {formattedDate} — 至今
            </div>
          </div>
        </div>

        {/* 天数 — 包裹在 AdminAuthTrigger 中 */}
        <AdminAuthTrigger>
          <div className="absolute top-50 right-6 text-right">
            <AnimatedDays days={days} />
            <div className="text-[11px] text-text-sub mt-1">天</div>
          </div>
        </AdminAuthTrigger>

        {/* 装饰元素：岛屿线稿 + 手账贴纸 */}
        <CoverDecorations />

        {/* 按钮区 */}
        <CoverActions
          isAuthenticated={!!role}
          href={latestDiary ? `/diary/${latestDiary.id}` : '/diary/new'}
          showWriteButton={role === 'admin'}
        />

        {/* 统计 — 包裹在 AdminAuthTrigger 中 */}
        <AdminAuthTrigger>
          <div className="absolute bottom-6 right-6 text-[10px] text-text-sub">
            日记 {stats.diaryCount} · 回忆 {stats.memoryCount}
          </div>
        </AdminAuthTrigger>
      </div>
    </div>
  );
}
