'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FloatingButton from './FloatingButton';
import ViewPasswordModal from './ViewPasswordModal';

interface CoverActionsProps {
  isAuthenticated: boolean;
  href: string;
  showWriteButton: boolean;
}

export default function CoverActions({ isAuthenticated, href, showWriteButton }: CoverActionsProps) {
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleReadClick = () => {
    if (isAuthenticated) {
      router.push(href);
    } else {
      setShowPasswordModal(true);
    }
  };

  return (
    <>
      <div className='absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3'>
        <button
          onClick={handleReadClick}
          className='inline-block bg-primary text-white rounded-full px-7 py-2.5 text-sm font-medium animate-float'
        >
          翻开日记
        </button>
        {showWriteButton && (
          <FloatingButton href='/diary/new'>写下今天</FloatingButton>
        )}
      </div>
      <ViewPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
}
