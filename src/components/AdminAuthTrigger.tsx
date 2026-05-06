'use client';

import { useState, useRef } from 'react';
import AdminPasswordModal from './AdminPasswordModal';

interface AdminAuthTriggerProps {
  children: React.ReactNode;
}

export default function AdminAuthTrigger({ children }: AdminAuthTriggerProps) {
  const [showModal, setShowModal] = useState(false);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDoubleClick = () => {
    setShowModal(true);
  };

  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      setShowModal(true);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  return (
    <>
      <div
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className='cursor-default select-none'
      >
        {children}
      </div>
      <AdminPasswordModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
