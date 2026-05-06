'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordModal from './PasswordModal';
import { verifyViewPassword } from '@/lib/actions';

interface ViewPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewPasswordModal({ isOpen, onClose }: ViewPasswordModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyViewPassword(password);
      if (result.ok) {
        onClose();
        router.push('/diary');
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
      title='输入密码查看日记'
      error={error}
      isLoading={isLoading}
    />
  );
}
