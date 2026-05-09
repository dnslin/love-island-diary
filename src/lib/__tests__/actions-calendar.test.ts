import { prisma } from '../prisma';
import { createDiary, getDiaryDatesInMonth } from '../actions';

jest.mock('../auth', () => ({
  requireAdmin: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    const err = new Error(`NEXT_REDIRECT:${url}`);
    (err as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw err;
  },
}));

describe('getDiaryDatesInMonth', () => {
  beforeEach(async () => {
    await prisma.diaryImage.deleteMany();
    await prisma.diaryEntry.deleteMany();
  });
  test('返回当月有日记的日期分组，按日期和创建时间升序', async () => {
    await createDiary({ date: new Date('2025-05-15'), title: '日记2', content: '内容2' });
    await createDiary({ date: new Date('2025-05-08'), title: '日记1', content: '内容1' });

    const result = await getDiaryDatesInMonth(2025, 5);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2025-05-08');
    expect(result[0].entries).toHaveLength(1);
    expect(result[0].entries[0].title).toBe('日记1');
    expect(result[1].date).toBe('2025-05-15');
    expect(result[1].entries[0].title).toBe('日记2');
  });

  test('同一天多篇日记正确分组', async () => {
    await createDiary({ date: new Date('2025-05-08'), title: '日记A', content: '内容A' });
    await createDiary({ date: new Date('2025-05-08'), title: '日记B', content: '内容B' });

    const result = await getDiaryDatesInMonth(2025, 5);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2025-05-08');
    expect(result[0].entries).toHaveLength(2);
  });

  test('当月无日记返回空数组', async () => {
    const result = await getDiaryDatesInMonth(2025, 5);
    expect(result).toEqual([]);
  });

  test('不返回其他月份数据', async () => {
    await createDiary({ date: new Date('2025-04-30'), title: '四月末', content: '内容' });
    await createDiary({ date: new Date('2025-06-01'), title: '六月初', content: '内容' });

    const result = await getDiaryDatesInMonth(2025, 5);
    expect(result).toEqual([]);
  });
});
