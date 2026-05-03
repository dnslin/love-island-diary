import dayjs from 'dayjs';
import Image from 'next/image';
import type { DiaryEntry, DiaryImage } from '@prisma/client';

interface DiaryDetailProps {
  entry: DiaryEntry & { images: DiaryImage[] };
}

const moodMap: Record<string, { label: string; color: string }> = {
  sweet: { label: '甜甜的', color: '#F7C8D0' },
  happy: { label: '开心', color: '#B8DDA8' },
  miss: { label: '想念', color: '#AFC9F7' },
  calm: { label: '平静', color: '#D8C7E8' },
  sad: { label: '小难过', color: '#E8C4A0' },
};

export function DiaryDetail({ entry }: DiaryDetailProps) {
  const displayTitle =
    entry.title || `${dayjs(entry.date).format('YYYY年M月D日')} 的心情`;
  const mood = moodMap[entry.mood] || moodMap.sweet;

  return (
    <article className="space-y-4">
      <h1 className="text-xl font-bold text-text-main">{displayTitle}</h1>

      <div className="flex items-center gap-2 text-sm text-text-sub">
        <span>{dayjs(entry.date).format('YYYY年M月D日')}</span>
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ backgroundColor: mood.color + '33' }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: mood.color }}
          />
          {mood.label}
        </span>
      </div>

      <p className="text-base text-text-main whitespace-pre-wrap leading-relaxed">
        {entry.content}
      </p>

      {entry.images.length > 0 && (
        <div
          className={`grid gap-2 ${
            entry.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {entry.images.map((img) => (
            <Image
              key={img.id}
              src={img.url}
              alt=""
              width={800}
              height={600}
              className="w-full rounded-lg object-cover"
              loading="lazy"
              unoptimized
            />
          ))}
        </div>
      )}
    </article>
  );
}
