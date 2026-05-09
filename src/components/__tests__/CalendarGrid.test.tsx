import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarGrid } from '../CalendarGrid';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('CalendarGrid', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test('渲染星期标题', () => {
    render(<CalendarGrid year={2025} month={5} diaryDays={[]} />);
    expect(screen.getByText('日')).toBeInTheDocument();
    expect(screen.getByText('一')).toBeInTheDocument();
    expect(screen.getByText('六')).toBeInTheDocument();
  });

  test('渲染当月日期', () => {
    render(<CalendarGrid year={2025} month={5} diaryDays={[]} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
  });

  test('有日记的日期显示小圆点', () => {
    render(
      <CalendarGrid
        year={2025}
        month={5}
        diaryDays={[
          { date: '2025-05-08', entries: [{ id: '1', title: '日记' }] },
        ]}
      />
    );
    const dayButton = screen.getByText('8').closest('button');
    expect(dayButton).toBeInTheDocument();
    expect(
      dayButton?.querySelector('[data-testid="diary-dot"]')
    ).toBeInTheDocument();
  });

  test('点击有单篇日记的日期直接跳转', () => {
    render(
      <CalendarGrid
        year={2025}
        month={5}
        diaryDays={[
          { date: '2025-05-08', entries: [{ id: 'entry-1', title: '日记' }] },
        ]}
      />
    );
    const dayButton = screen.getByText('8').closest('button');
    fireEvent.click(dayButton!);
    expect(mockPush).toHaveBeenCalledWith('/diary/entry-1');
  });

  test('点击无日记的日期无反应', () => {
    render(<CalendarGrid year={2025} month={5} diaryDays={[]} />);
    const dayButton = screen.getByText('15').closest('button');
    expect(dayButton).toBeDisabled();
  });

  test('点击有多篇日记的日期弹出浮层而非跳转', () => {
    render(
      <CalendarGrid
        year={2025}
        month={5}
        diaryDays={[
          {
            date: '2025-05-08',
            entries: [
              { id: 'entry-a', title: '日记A' },
              { id: 'entry-b', title: '日记B' },
            ],
          },
        ]}
      />
    );
    const dayButton = screen.getByText('8').closest('button');
    fireEvent.click(dayButton!);
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByText('5月8日的日记')).toBeInTheDocument();
    expect(screen.getByText('日记A')).toBeInTheDocument();
    expect(screen.getByText('日记B')).toBeInTheDocument();
  });
});
