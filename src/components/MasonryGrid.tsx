'use client';

import { useState, useEffect, useRef } from 'react';
import { MemoryCard } from './MemoryCard';
import { StaggerContainer } from './animations';

interface ImageItem {
  id: string;
  url: string;
  entryId: string;
}

interface MasonryGridProps {
  images: ImageItem[];
}

function getColumnCount(width: number): number {
  return width >= 640 ? 3 : 2;
}

export function MasonryGrid({ images }: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(2);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setColumnCount(getColumnCount(entry.contentRect.width));
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const columns: ImageItem[][] = Array.from(
    { length: columnCount },
    () => [],
  );
  images.forEach((image, index) => {
    columns[index % columnCount].push(image);
  });

  return (
    <div ref={containerRef} className="flex gap-2">
      {columns.map((col, colIndex) => (
        <div key={colIndex} className="flex-1 flex flex-col gap-2">
          <StaggerContainer>
            {col.map((image) => (
              <MemoryCard key={image.id} image={image} />
            ))}
          </StaggerContainer>
        </div>
      ))}
    </div>
  );
}
