import type { Metadata } from 'next';
import { getAllDiaryImages } from '@/lib/actions';
import { MasonryGrid } from '@/components/MasonryGrid';
import { EmptyMemories } from '@/components/EmptyMemories';

export const metadata: Metadata = {
  title: '回忆照片墙',
};

export default async function MemoriesPage() {
  const images = await getAllDiaryImages();

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-text-main mb-4">回忆照片墙</h1>
        {images.length === 0 ? (
          <EmptyMemories />
        ) : (
          <MasonryGrid
            images={images.map((img) => ({
              id: img.id,
              url: img.url,
              entryId: img.entryId,
              title: img.entry.title,
            }))}
          />
        )}
      </div>
    </main>
  );
}
