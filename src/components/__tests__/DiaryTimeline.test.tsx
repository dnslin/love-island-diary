import { render, screen } from '@testing-library/react';
import { DiaryTimeline } from '../DiaryTimeline';
import type { DiaryEntry, DiaryImage } from '@prisma/client';

type Entry = DiaryEntry & { images: DiaryImage[] };

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: overrides.id ?? 'id1',
    date: overrides.date ?? new Date('2025-01-15'),
    title: overrides.title ?? 'Test Title',
    content: overrides.content ?? 'content',
    mood: overrides.mood ?? 'sweet',
    weather: overrides.weather ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    images: overrides.images ?? [],
  } as Entry;
}

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

describe('DiaryTimeline', () => {
  test('renders empty state without write button by default', () => {
    render(<DiaryTimeline groups={new Map()} />);

    expect(
      screen.getByText('还没有日记呢，翻开第一页吧')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '写下第一篇' })
    ).not.toBeInTheDocument();
  });

  test('renders empty state with write button when showWriteButton is true', () => {
    render(<DiaryTimeline groups={new Map()} showWriteButton={true} />);

    expect(
      screen.getByText('还没有日记呢，翻开第一页吧')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '写下第一篇' })).toHaveAttribute(
      'href',
      '/diary/new'
    );
  });

  test('renders single month with single entry', () => {
    const groups = new Map<string, Entry[]>([
      ['2025-01', [makeEntry()]],
    ]);

    render(<DiaryTimeline groups={groups} />);

    expect(screen.getByRole('heading', { name: '2025 年 1 月' })).toBeInTheDocument();
    expect(screen.getByText('1月15日 星期三')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('renders default title when title is empty', () => {
    const groups = new Map<string, Entry[]>([
      ['2025-01', [makeEntry({ title: '' })]],
    ]);

    render(<DiaryTimeline groups={groups} />);

    expect(screen.getByText('2025年1月15日 的心情')).toBeInTheDocument();
  });

  test('renders multiple months in order', () => {
    const groups = new Map<string, Entry[]>([
      ['2025-02', [makeEntry({ id: 'id2', date: new Date('2025-02-10') })]],
      ['2025-01', [makeEntry()]],
    ]);

    render(<DiaryTimeline groups={groups} />);

    const headings = screen.getAllByRole('heading');
    expect(headings[0]).toHaveTextContent('2025 年 2 月');
    expect(headings[1]).toHaveTextContent('2025 年 1 月');
  });

  test('renders multiple entries within same month', () => {
    const groups = new Map<string, Entry[]>([
      [
        '2025-01',
        [
          makeEntry({ id: 'id1', title: 'First Entry' }),
          makeEntry({ id: 'id2', title: 'Second Entry', date: new Date('2025-01-20') }),
        ],
      ],
    ]);

    render(<DiaryTimeline groups={groups} />);

    expect(screen.getByText('First Entry')).toBeInTheDocument();
    expect(screen.getByText('Second Entry')).toBeInTheDocument();
  });
});
