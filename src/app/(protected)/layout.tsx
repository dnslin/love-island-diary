import { redirect } from 'next/navigation';
import { getCoupleProfile } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCoupleProfile();
  if (!profile) {
    redirect('/settings');
  }
  return <>{children}</>;
}
