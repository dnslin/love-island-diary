import { render, screen, act } from '@testing-library/react';
import { MasonryGrid } from '../MasonryGrid';

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
  StaggerContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stagger-container">{children}</div>
  ),
  StaggerItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

let resizeCallback: ((entries: Array<{ contentRect: { width: number } }>) => void) | null = null;

class MockResizeObserver {
  constructor(callback: typeof resizeCallback) {
    resizeCallback = callback;
  }
  observe = jest.fn();
  disconnect = jest.fn();
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

describe('MasonryGrid', () => {
  const mockImages = [
    { id: '1', url: 'https://example.com/1.jpg', entryId: 'e1' },
    { id: '2', url: 'https://example.com/2.jpg', entryId: 'e2' },
    { id: '3', url: 'https://example.com/3.jpg', entryId: 'e3' },
    { id: '4', url: 'https://example.com/4.jpg', entryId: 'e4' },
  ];

  test('渲染所有图片卡片', () => {
    render(<MasonryGrid images={mockImages} />);
    expect(screen.getAllByAltText('回忆照片')).toHaveLength(4);
  });

  test('空数组时不渲染图片', () => {
    render(<MasonryGrid images={[]} />);
    expect(screen.queryAllByAltText('回忆照片')).toHaveLength(0);
  });

  test('触发 ResizeObserver 回调后列数变化', () => {
    render(<MasonryGrid images={mockImages} />);
    // 初始宽度默认为 0，列数为 2
    const containers = screen.getAllByTestId('stagger-container');
    expect(containers).toHaveLength(2);

    // 模拟宽度 >= 640px，应变为 3 列
    act(() => {
      resizeCallback?.([{ contentRect: { width: 700 } }]);
    });

    const containersAfter = screen.getAllByTestId('stagger-container');
    expect(containersAfter).toHaveLength(3);
  });
});
