'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordModal from './PasswordModal';
import { verifyAdminPassword } from '@/lib/actions';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPasswordModal({ isOpen, onClose }: AdminPasswordModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyAdminPassword(password);
      if (result.ok) {
        onClose();
        router.refresh();
      } else {
        setError(result.error ?? '密码错误，请重试');
      }
    } catch {
      setError('验证失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PasswordModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='管理员验证'
      error={error}
      isLoading={isLoading}
    />
  );
}
