import { getCoupleProfile } from '@/lib/actions';
import SettingsForm from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';

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
