import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.diaryEntry.deleteMany();

  const entries = await Promise.all([
    prisma.diaryEntry.create({
      data: {
        date: new Date('2025-01-10'),
        title: '第一次见面',
        content: '今天我们在咖啡馆第一次见面，心跳得好快...',
        mood: 'sweet',
      },
    }),
    prisma.diaryEntry.create({
      data: {
        date: new Date('2025-01-15'),
        title: '一起看电影',
        content: '看了一部浪漫的爱情电影，牵了手。',
        mood: 'happy',
      },
    }),
    prisma.diaryEntry.create({
      data: {
        date: new Date('2025-01-20'),
        title: '今天有点想你了',
        content: '分开的第二天，已经开始想念了。',
        mood: 'miss',
      },
    }),
  ]);

  console.log(
    'Created entries:',
    entries.map((e) => ({ id: e.id, title: e.title })),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
