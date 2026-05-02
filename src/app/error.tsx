'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center max-w-[320px]">
        <div className="text-4xl mb-4"> something went wrong </div>
        <p className="text-text-sub text-sm mb-6">
          {error.message || '页面加载时遇到了问题，请稍后再试。'}
        </p>
        <button
          onClick={reset}
          className="inline-block bg-primary text-white rounded-full px-6 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}
