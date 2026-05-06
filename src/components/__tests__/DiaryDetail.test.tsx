import { render, screen } from '@testing-library/react';
import type { DiaryEntry, DiaryImage } from '@prisma/client';
import { DiaryDetail } from '../DiaryDetail';

type Entry = DiaryEntry & { images: DiaryImage[] };

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: overrides.id ?? 'id1',
    date: overrides.date ?? new Date('2025-01-15'),
    title: overrides.title === undefined ? 'Test Title' : overrides.title,
    content: overrides.content ?? 'content',
    mood: overrides.mood ?? 'sweet',
    weather: overrides.weather ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    images: overrides.images ?? [],
  } as Entry;
}

describe('DiaryDetail', () => {
  it('传入 entryNumber={12} 时显示"第 12 篇"', () => {
    render(<DiaryDetail entry={makeEntry()} entryNumber={12} />);
    expect(screen.getByText('第 12 篇')).toBeInTheDocument();
  });

  it('不传 entryNumber 时不显示篇数', () => {
    render(<DiaryDetail entry={makeEntry()} />);
    expect(screen.queryByText(/第 \d+ 篇/)).not.toBeInTheDocument();
  });

  it('标题和内容渲染正常', () => {
    render(<DiaryDetail entry={makeEntry({ title: 'My Day', content: 'Today was great.' })} />);
    expect(screen.getByText('My Day')).toBeInTheDocument();
    expect(screen.getByText('Today was great.')).toBeInTheDocument();
  });

  it('标题为 null 时显示默认标题', () => {
    render(<DiaryDetail entry={makeEntry({ title: null })} />);
    expect(screen.getByText('2025年1月15日 的心情')).toBeInTheDocument();
  });
});
