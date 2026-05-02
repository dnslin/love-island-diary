import type { Metadata } from 'next';
import { getCoupleProfile } from '@/lib/actions';
import SettingsForm from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getCoupleProfile();
  return {
    title: profile ? '修改情侣信息' : '告诉我们一些关于你们的事',
  };
}

export default async function SettingsPage() {
  const profile = await getCoupleProfile();

  const initial = profile
    ? {
        personAName: profile.personAName,
        personBName: profile.personBName,
        anniversaryDate: profile.anniversaryDate,
        siteTitle: profile.siteTitle,
      }
    : null;

  return <SettingsForm initial={initial} />;
}
