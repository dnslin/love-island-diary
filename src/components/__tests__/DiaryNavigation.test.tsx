import { render, screen, fireEvent } from '@testing-library/react';
import { DiaryNavigation } from '../DiaryNavigation';

describe('DiaryNavigation', () => {
  const mockOnPrev = jest.fn();
  const mockOnNext = jest.fn();

  beforeEach(() => {
    mockOnPrev.mockClear();
    mockOnNext.mockClear();
  });

  it('两个邻居都存在时，显示所有按钮（时间线、上一篇、下一篇）', () => {
    render(
      <DiaryNavigation
        prevId="prev-1"
        nextId="next-1"
        onPrev={mockOnPrev}
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText('时间线')).toBeInTheDocument();
    expect(screen.getByText('上一篇')).toBeInTheDocument();
    expect(screen.getByText('下一篇')).toBeInTheDocument();
  });

  it('prevId 为 null 时隐藏上一篇按钮', () => {
    render(
      <DiaryNavigation
        prevId={null}
        nextId="next-1"
        onPrev={mockOnPrev}
        onNext={mockOnNext}
      />
    );

    expect(screen.queryByText('上一篇')).not.toBeInTheDocument();
    expect(screen.getByText('下一篇')).toBeInTheDocument();
    expect(screen.getByText('时间线')).toBeInTheDocument();
  });

  it('nextId 为 null 时隐藏下一篇按钮', () => {
    render(
      <DiaryNavigation
        prevId="prev-1"
        nextId={null}
        onPrev={mockOnPrev}
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText('上一篇')).toBeInTheDocument();
    expect(screen.queryByText('下一篇')).not.toBeInTheDocument();
    expect(screen.getByText('时间线')).toBeInTheDocument();
  });

  it('两个都为 null 时隐藏两个导航按钮', () => {
    render(
      <DiaryNavigation
        prevId={null}
        nextId={null}
        onPrev={mockOnPrev}
        onNext={mockOnNext}
      />
    );

    expect(screen.queryByText('上一篇')).not.toBeInTheDocument();
    expect(screen.queryByText('下一篇')).not.toBeInTheDocument();
    expect(screen.getByText('时间线')).toBeInTheDocument();
  });

  it('点击上一篇调用 onPrev', () => {
    render(
      <DiaryNavigation
        prevId="prev-1"
        nextId="next-1"
        onPrev={mockOnPrev}
        onNext={mockOnNext}
      />
    );

    fireEvent.click(screen.getByText('上一篇'));
    expect(mockOnPrev).toHaveBeenCalledTimes(1);
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('点击下一篇调用 onNext', () => {
    render(
      <DiaryNavigation
        prevId="prev-1"
        nextId="next-1"
        onPrev={mockOnPrev}
        onNext={mockOnNext}
      />
    );

    fireEvent.click(screen.getByText('下一篇'));
    expect(mockOnNext).toHaveBeenCalledTimes(1);
    expect(mockOnPrev).not.toHaveBeenCalled();
  });

  it('时间线按钮链接到 /diary', () => {
    render(
      <DiaryNavigation
        prevId="prev-1"
        nextId="next-1"
        onPrev={mockOnPrev}
        onNext={mockOnNext}
      />
    );

    const timelineLink = screen.getByText('时间线').closest('a');
    expect(timelineLink).toHaveAttribute('href', '/diary');
  });
});
