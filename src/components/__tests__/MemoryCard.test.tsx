import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryCard } from '../MemoryCard';

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

jest.mock('../animations', () => ({
  StaggerItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe('MemoryCard', () => {
  const mockImage = {
    id: 'img1',
    url: 'https://example.com/photo.jpg',
    entryId: 'entry1',
    title: '第一次约会',
  };

  test('渲染图片和链接', () => {
    render(<MemoryCard image={mockImage} />);
    const img = screen.getByAltText('第一次约会');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img.closest('a')).toHaveAttribute('href', '/diary/entry1');
  });

  test('图片加载失败时显示占位符', () => {
    render(<MemoryCard image={mockImage} />);
    const img = screen.getByAltText('第一次约会');
    fireEvent.error(img);
    expect(screen.getByText('图片加载失败')).toBeInTheDocument();
    expect(img).not.toBeInTheDocument();
  });
});
