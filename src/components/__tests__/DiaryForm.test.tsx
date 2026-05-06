import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { DiaryEntry, DiaryImage } from '@prisma/client';
import { DiaryForm } from '../DiaryForm';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/actions', () => ({
  createDiary: jest.fn(),
  updateDiary: jest.fn(),
}));

jest.mock('@/hooks/useDiaryDraft', () => ({
  useDiaryDraft: jest.fn((_key: string, defaultValue: unknown) => {
    const [value, setValue] = [defaultValue, jest.fn()];
    return [value, setValue, jest.fn()] as const;
  }),
}));

import { updateDiary } from '@/lib/actions';

describe('DiaryForm edit mode', () => {
  const mockEntry: DiaryEntry & { images: DiaryImage[] } = {
    id: 'entry-1',
    date: new Date('2025-03-15'),
    title: 'Original Title',
    content: 'Original content',
    mood: 'happy',
    weather: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [
      { id: 'img-1', url: 'https://example.com/1.jpg', entryId: 'entry-1', createdAt: new Date() },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('编辑模式下预填充已有数据', () => {
    render(<DiaryForm mode="edit" initialData={mockEntry} entryId="entry-1" />);
    const titleInput = screen.getByPlaceholderText('给今天起个名字（可选）') as HTMLInputElement;
    const contentInput = screen.getByPlaceholderText('今天发生了什么？') as HTMLTextAreaElement;
    const dateInput = screen.getByDisplayValue('2025-03-15') as HTMLInputElement;
    expect(titleInput.value).toBe('Original Title');
    expect(contentInput.value).toBe('Original content');
    expect(dateInput).toBeInTheDocument();
  });

  it('编辑模式下点击保存调用 updateDiary 并跳转详情页', async () => {
    jest.useFakeTimers();
    (updateDiary as jest.Mock).mockResolvedValue({ id: 'entry-1' });
    render(<DiaryForm mode="edit" initialData={mockEntry} entryId="entry-1" />);
    fireEvent.click(screen.getByText('保存'));
    await waitFor(() => {
      expect(updateDiary).toHaveBeenCalledWith(
        'entry-1',
        expect.objectContaining({ content: 'Original content', mood: 'happy' }),
      );
    });
    jest.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/diary/entry-1');
    });
    jest.useRealTimers();
  });
});
