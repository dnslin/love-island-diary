import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PageFlipWrapper } from '../PageFlipWrapper';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const mockSessionStorage = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: mockSessionStorage,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children, onExitComplete }: any) => {
    // 当 children 被移除时（exit），立即触发 onExitComplete 模拟动画完成
    if (!children && onExitComplete) {
      onExitComplete();
    }
    return <>{children}</>;
  },
}));

describe('PageFlipWrapper', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSessionStorage.clear();
  });

  it('渲染 children 内容', () => {
    render(
      <PageFlipWrapper prevId="prev1" nextId="next1" currentId="id1">
        <div data-testid="child">日记内容</div>
      </PageFlipWrapper>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('日记内容');
  });

  it('点击上一篇按钮后调用 router.push', async () => {
    render(
      <PageFlipWrapper prevId="prev1" nextId="next1" currentId="id1">
        <div>内容</div>
      </PageFlipWrapper>
    );

    fireEvent.click(screen.getByLabelText('上一篇'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/diary/prev1');
    });
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('pageFlipDirection', 'left');
  });

  it('点击下一篇按钮后调用 router.push', async () => {
    render(
      <PageFlipWrapper prevId="prev1" nextId="next1" currentId="id1">
        <div>内容</div>
      </PageFlipWrapper>
    );

    fireEvent.click(screen.getByLabelText('下一篇'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/diary/next1');
    });
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('pageFlipDirection', 'right');
  });

  it('prevId 为 null 时隐藏上一篇按钮', () => {
    render(
      <PageFlipWrapper prevId={null} nextId="next1" currentId="id1">
        <div>内容</div>
      </PageFlipWrapper>
    );

    expect(screen.queryByLabelText('上一篇')).not.toBeInTheDocument();
    expect(screen.getByLabelText('下一篇')).toBeInTheDocument();
  });

  it('nextId 为 null 时隐藏下一篇按钮', () => {
    render(
      <PageFlipWrapper prevId="prev1" nextId={null} currentId="id1">
        <div>内容</div>
      </PageFlipWrapper>
    );

    expect(screen.getByLabelText('上一篇')).toBeInTheDocument();
    expect(screen.queryByLabelText('下一篇')).not.toBeInTheDocument();
  });

  it('两个都为 null 时隐藏两个按钮', () => {
    render(
      <PageFlipWrapper prevId={null} nextId={null} currentId="id1">
        <div>内容</div>
      </PageFlipWrapper>
    );

    expect(screen.queryByLabelText('上一篇')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('下一篇')).not.toBeInTheDocument();
  });

  it('点击按钮后禁用导航按钮（动画锁）', () => {
    render(
      <PageFlipWrapper prevId="prev1" nextId="next1" currentId="id1">
        <div>内容</div>
      </PageFlipWrapper>
    );

    const prevBtn = screen.getByLabelText('上一篇');
    fireEvent.click(prevBtn);

    // 按钮被 disabled
    expect(prevBtn).toBeDisabled();
    expect(screen.getByLabelText('下一篇')).toBeDisabled();
  });
});