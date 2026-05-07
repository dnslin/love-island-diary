'use client';

import { useState } from 'react';
import { ScaleIn } from './animations';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  title: string;
  error: string | null;
  isLoading: boolean;
}

export default function PasswordModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  error,
  isLoading,
}: PasswordModalProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;
    onSubmit(password.trim());
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'>
      <ScaleIn>
        <div className='w-full max-w-[320px] mx-4 bg-card rounded-2xl border border-border-soft shadow-lg p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <svg
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='#5B4B49'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
              <path d='M7 11V7a5 5 0 0 1 10 0v4' />
            </svg>
            <h3 className='text-base font-bold text-text-main'>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className='text-text-sub hover:text-text-main transition-colors'
            aria-label='关闭'
            type='button'
          >
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M18 6 6 18' />
              <path d='m6 6 12 12' />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='请输入密码'
            disabled={isLoading}
            className='w-full px-4 py-3 rounded-xl border border-border-soft bg-cream text-text-main text-base placeholder:text-text-sub focus:outline-none focus:border-[#ffcc00] transition-colors disabled:opacity-50'
          />

          {error && (
            <p className='mt-2 text-sm text-accent'>{error}</p>
          )}

          <button
            type='submit'
            disabled={isLoading || !password.trim()}
            className='w-full mt-4 py-3 rounded-full bg-primary text-white font-medium text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? '验证中...' : '确认'}
          </button>
        </form>
      </div>
    </ScaleIn>
  </div>
  );
}
