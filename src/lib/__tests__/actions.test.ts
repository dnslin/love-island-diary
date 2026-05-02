import { prisma } from '../prisma';
import {
  createDiary,
  getDiaryById,
  getDiaryList,
  updateDiary,
  deleteDiary,
  getDiaryNeighbors,
  getCoupleProfile,
  updateCoupleProfile,
  getCoverStats,
  saveCoupleProfileAction,
} from '../actions';
import dayjs from 'dayjs';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    const err = new Error(`NEXT_REDIRECT:${url}`);
    (err as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw err;
  },
}));

beforeEach(async () => {
  await prisma.diaryImage.deleteMany();
  await prisma.diaryEntry.deleteMany();
  await prisma.coupleProfile.deleteMany();
});

describe('Diary Actions', () => {
  test('createDiary creates a diary with images', async () => {
    const diary = await createDiary({
      date: new Date('2025-01-15'),
      title: '第一次见面',
      content: '今天是我们第一次见面的日子，超级开心！',
      mood: 'happy',
      weather: 'sunny',
      images: ['https://example.com/photo1.jpg'],
    });

    expect(diary.title).toBe('第一次见面');
    expect(diary.content).toBe('今天是我们第一次见面的日子，超级开心！');
    expect(diary.mood).toBe('happy');
    expect(diary.weather).toBe('sunny');
    expect(diary.images).toHaveLength(1);
    expect(diary.images[0].url).toBe('https://example.com/photo1.jpg');
  });

  test('getDiaryById returns diary with images', async () => {
    const created = await createDiary({
      date: new Date('2025-01-15'),
      title: '测试',
      content: '内容',
      images: ['https://example.com/a.jpg'],
    });

    const found = await getDiaryById(created.id);
    expect(found?.id).toBe(created.id);
    expect(found?.images).toHaveLength(1);
  });

  test('getDiaryList returns diaries ordered by date desc', async () => {
    await createDiary({ date: new Date('2025-01-10'), title: 'A', content: 'a' });
    await createDiary({ date: new Date('2025-01-20'), title: 'B', content: 'b' });
    await createDiary({ date: new Date('2025-01-15'), title: 'C', content: 'c' });

    const list = await getDiaryList();
    expect(list).toHaveLength(3);
    expect(list[0].title).toBe('B');
    expect(list[1].title).toBe('C');
    expect(list[2].title).toBe('A');
  });

  test('updateDiary updates fields and images', async () => {
    const created = await createDiary({
      date: new Date('2025-01-15'),
      title: '旧标题',
      content: '旧内容',
      images: ['https://example.com/old.jpg'],
    });

    const updated = await updateDiary(created.id, {
      title: '新标题',
      content: '新内容',
      images: ['https://example.com/new.jpg'],
    });

    expect(updated.title).toBe('新标题');
    expect(updated.content).toBe('新内容');
    expect(updated.images).toHaveLength(1);
    expect(updated.images[0].url).toBe('https://example.com/new.jpg');
  });

  test('updateDiary preserves images when images not provided', async () => {
    const created = await createDiary({
      date: new Date('2025-01-15'),
      title: '标题',
      content: '内容',
      images: ['https://example.com/keep.jpg'],
    });

    const updated = await updateDiary(created.id, {
      title: '新标题',
    });

    expect(updated.title).toBe('新标题');
    expect(updated.images).toHaveLength(1);
    expect(updated.images[0].url).toBe('https://example.com/keep.jpg');
  });

  test('updateDiary clears images when empty array provided', async () => {
    const created = await createDiary({
      date: new Date('2025-01-15'),
      title: '标题',
      content: '内容',
      images: ['https://example.com/clear.jpg'],
    });

    const updated = await updateDiary(created.id, {
      title: '新标题',
      images: [],
    });

    expect(updated.title).toBe('新标题');
    expect(updated.images).toHaveLength(0);
  });

  test('deleteDiary removes diary and cascades images', async () => {
    const created = await createDiary({
      date: new Date('2025-01-15'),
      title: '待删除',
      content: '内容',
      images: ['https://example.com/del.jpg'],
    });

    await deleteDiary(created.id);

    const found = await getDiaryById(created.id);
    expect(found).toBeNull();

    const images = await prisma.diaryImage.findMany({
      where: { entryId: created.id },
    });
    expect(images).toHaveLength(0);
  });

  test('getDiaryNeighbors returns prev and next', async () => {
    const first = await createDiary({ date: new Date('2025-01-10'), title: 'First', content: 'a' });
    const second = await createDiary({ date: new Date('2025-01-20'), title: 'Second', content: 'b' });
    const third = await createDiary({ date: new Date('2025-01-30'), title: 'Third', content: 'c' });

    const midNeighbors = await getDiaryNeighbors(second.id);
    expect(midNeighbors.prev).toBe(first.id);
    expect(midNeighbors.next).toBe(third.id);

    const firstNeighbors = await getDiaryNeighbors(first.id);
    expect(firstNeighbors.prev).toBeNull();
    expect(firstNeighbors.next).toBe(second.id);

    const lastNeighbors = await getDiaryNeighbors(third.id);
    expect(lastNeighbors.prev).toBe(second.id);
    expect(lastNeighbors.next).toBeNull();
  });

  test('getDiaryNeighbors returns null for non-existent id', async () => {
    const neighbors = await getDiaryNeighbors('non-existent-id');
    expect(neighbors.prev).toBeNull();
    expect(neighbors.next).toBeNull();
  });

  test('createDiary rejects content exceeding 10000 characters', async () => {
    const longContent = 'a'.repeat(10001);
    await expect(
      createDiary({
        date: new Date('2025-01-15'),
        title: '超长内容测试',
        content: longContent,
      }),
    ).rejects.toThrow();
  });
});

describe('CoupleProfile Actions', () => {
  test('getCoupleProfile returns null when no record', async () => {
    const profile = await getCoupleProfile();
    expect(profile).toBeNull();
  });

  test('updateCoupleProfile creates a new record', async () => {
    const profile = await updateCoupleProfile({
      personAName: '小兔子',
      personBName: '大灰狼',
      anniversaryDate: new Date('2024-07-18'),
      siteTitle: '恋爱小岛日记',
    });

    expect(profile.personAName).toBe('小兔子');
    expect(profile.personBName).toBe('大灰狼');
    expect(profile.siteTitle).toBe('恋爱小岛日记');
  });

  test('updateCoupleProfile updates existing record', async () => {
    await updateCoupleProfile({
      personAName: '小兔子',
      personBName: '大灰狼',
      anniversaryDate: new Date('2024-07-18'),
    });

    const updated = await updateCoupleProfile({
      personAName: '小白兔',
      personBName: '大灰狼',
      anniversaryDate: new Date('2024-07-18'),
      siteTitle: '新的标题',
    });

    expect(updated.personAName).toBe('小白兔');
    expect(updated.siteTitle).toBe('新的标题');

    const count = await prisma.coupleProfile.count();
    expect(count).toBe(1);
  });
});

describe('Cover Stats', () => {
  test('getCoverStats returns zero counts when empty', async () => {
    const stats = await getCoverStats();
    expect(stats.diaryCount).toBe(0);
    expect(stats.memoryCount).toBe(0);
  });

  test('getCoverStats returns correct counts', async () => {
    await createDiary({
      date: new Date('2025-01-15'),
      title: '第一篇',
      content: '内容',
      images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
    });
    await createDiary({
      date: new Date('2025-01-16'),
      title: '第二篇',
      content: '内容',
    });

    const stats = await getCoverStats();
    expect(stats.diaryCount).toBe(2);
    expect(stats.memoryCount).toBe(2);
  });
});

describe('saveCoupleProfileAction', () => {
  test('拒绝未来日期', async () => {
    const fd = new FormData();
    fd.set('personAName', '小兔子');
    fd.set('personBName', '大灰狼');
    fd.set('anniversaryDate', dayjs().add(1, 'day').format('YYYY-MM-DD'));
    fd.set('siteTitle', '');

    const state = await saveCoupleProfileAction({ ok: true }, fd);

    expect(state.ok).toBe(false);
    expect(state.fieldErrors?.anniversaryDate).toBe('在一起日期不能晚于今天');
  });

  test('拒绝空白姓名(trim 后为空)', async () => {
    const fd = new FormData();
    fd.set('personAName', '   ');
    fd.set('personBName', '大灰狼');
    fd.set('anniversaryDate', '2024-07-18');
    fd.set('siteTitle', '');

    const state = await saveCoupleProfileAction({ ok: true }, fd);

    expect(state.ok).toBe(false);
    expect(state.fieldErrors?.personAName).toBe('请填写第一位的昵称');
  });

  test('成功路径写入 profile 并 redirect 到 /', async () => {
    const fd = new FormData();
    fd.set('personAName', '小兔子');
    fd.set('personBName', '大灰狼');
    fd.set('anniversaryDate', '2024-07-18');
    fd.set('siteTitle', '恋爱小岛日记');

    await expect(
      saveCoupleProfileAction({ ok: true }, fd),
    ).rejects.toThrow('NEXT_REDIRECT:/');

    const profile = await prisma.coupleProfile.findFirst();
    expect(profile?.personAName).toBe('小兔子');
    expect(profile?.personBName).toBe('大灰狼');
    expect(profile?.siteTitle).toBe('恋爱小岛日记');
  });

  test('成功路径下空白 siteTitle 归一化为 null', async () => {
    const fd = new FormData();
    fd.set('personAName', '小兔子');
    fd.set('personBName', '大灰狼');
    fd.set('anniversaryDate', '2024-07-18');
    fd.set('siteTitle', '   ');

    await expect(
      saveCoupleProfileAction({ ok: true }, fd),
    ).rejects.toThrow('NEXT_REDIRECT:/');

    const profile = await prisma.coupleProfile.findFirst();
    expect(profile?.siteTitle).toBeNull();
  });
});
