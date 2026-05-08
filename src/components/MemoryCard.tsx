'use client';

import Link from 'next/link';
import { useState } from 'react';
import { StaggerItem } from './animations';

interface MemoryCardProps {
  image: {
    id: string;
    url: string;
    entryId: string;
    title: string | null;
  };
}

export function MemoryCard({ image }: MemoryCardProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <StaggerItem>
      <Link href={`/diary/${image.entryId}`} className="block">
        {hasError ? (
          <div className="w-full min-h-[120px] bg-border-soft rounded-xl flex items-center justify-center">
            <span className="text-xs text-text-sub">图片加载失败</span>
          </div>
        ) : (
          <img
            src={image.url}
            alt={image.title ?? '回忆照片'}
            loading="lazy"
            className="w-full h-auto rounded-xl object-cover hover:scale-[1.02] hover:shadow-md transition-all duration-200"
            onError={() => setHasError(true)}
          />
        )}
      </Link>
    </StaggerItem>
  );
}
