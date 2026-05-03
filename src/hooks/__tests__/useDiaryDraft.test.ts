import { renderHook, act } from '@testing-library/react';
import { useDiaryDraft } from '../useDiaryDraft';

describe('useDiaryDraft', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('初始化返回默认值', () => {
    const { result } = renderHook(() =>
      useDiaryDraft('diary-draft', { content: '' }),
    );
    expect(result.current[0]).toEqual({ content: '' });
  });

  test('500ms 防抖后保存到 localStorage', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() =>
      useDiaryDraft('diary-draft', { content: '' }),
    );

    act(() => {
      result.current[1]({ content: 'hello' });
    });

    expect(localStorage.getItem('diary-draft')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(localStorage.getItem('diary-draft')).toBe(
      JSON.stringify({ content: 'hello' }),
    );
    jest.useRealTimers();
  });

  test('挂载时恢复 localStorage 草稿', () => {
    localStorage.setItem('diary-draft', JSON.stringify({ content: 'restored' }));

    const { result } = renderHook(() =>
      useDiaryDraft('diary-draft', { content: '' }),
    );

    expect(result.current[0]).toEqual({ content: 'restored' });
  });

  test('clearDraft 清除 localStorage', () => {
    localStorage.setItem('diary-draft', JSON.stringify({ content: 'hello' }));

    const { result } = renderHook(() =>
      useDiaryDraft('diary-draft', { content: '' }),
    );

    act(() => {
      result.current[2]();
    });

    expect(localStorage.getItem('diary-draft')).toBeNull();
  });
});
