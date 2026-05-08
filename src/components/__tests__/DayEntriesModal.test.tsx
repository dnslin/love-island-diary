import { render, screen, fireEvent } from '@testing-library/react';
import { DayEntriesModal } from '../DayEntriesModal';

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) {
    return (
      <a href={href} onClick={onClick}>
        {children}
      </a>
    );
  };
});

jest.mock('@/lib/dayjs', () => {
  return {
    __esModule: true,
    default: (date: string) => ({
      format: (fmt: string) => {
        if (fmt === 'M月D日') return '5月8日';
        return date;
      },
    }),
  };
});

describe('DayEntriesModal', () => {
  test('关闭时不渲染日记内容', () => {
    render(
      <DayEntriesModal
        open={false}
        date="2025-05-08"
        entries={[]}
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByText('5月8日的日记')).not.toBeInTheDocument();
  });

  test('打开时渲染日期标题和日记列表', () => {
    render(
      <DayEntriesModal
        open={true}
        date="2025-05-08"
        entries={[
          { id: '1', title: '第一篇' },
          { id: '2', title: '第二篇' },
        ]}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('5月8日的日记')).toBeInTheDocument();
    expect(screen.getByText('第一篇')).toBeInTheDocument();
    expect(screen.getByText('第二篇')).toBeInTheDocument();
  });

  test('点击日记项触发关闭回调', () => {
    const handleClose = jest.fn();
    render(
      <DayEntriesModal
        open={true}
        date="2025-05-08"
        entries={[{ id: '1', title: '第一篇' }]}
        onClose={handleClose}
      />
    );
    const link = screen.getByText('第一篇');
    fireEvent.click(link);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('无标题时显示默认文案', () => {
    render(
      <DayEntriesModal
        open={true}
        date="2025-05-08"
        entries={[{ id: '1', title: null }]}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('5月8日 的心情')).toBeInTheDocument();
  });
});
