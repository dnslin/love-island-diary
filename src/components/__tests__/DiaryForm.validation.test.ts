import { validateDiaryForm } from '../DiaryForm.validation';

describe('validateDiaryForm', () => {
  const base = {
    date: '2025-01-15',
    title: '',
    content: '今天很开心',
    mood: 'sweet' as const,
    images: [] as string[],
  };

  test('空正文返回错误', () => {
    const result = validateDiaryForm({ ...base, content: '' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('写点什么吧');
  });

  test('空白正文返回错误', () => {
    const result = validateDiaryForm({ ...base, content: '   ' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('写点什么吧');
  });

  test('10000 字符正文通过', () => {
    const result = validateDiaryForm({ ...base, content: 'a'.repeat(10000) });
    expect(result.ok).toBe(true);
  });

  test('10001 字符正文失败', () => {
    const result = validateDiaryForm({ ...base, content: 'a'.repeat(10001) });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('正文太长了，最多 10000 字');
  });
});
