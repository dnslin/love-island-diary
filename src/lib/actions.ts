'use server';

import { prisma } from './prisma';
import {
  CreateDiarySchema,
  UpdateDiarySchema,
  type CreateDiaryInput,
  type UpdateDiaryInput,
} from './schemas';

export async function createDiary(data: CreateDiaryInput) {
  const parsed = CreateDiarySchema.parse(data);
  const { images, ...entryData } = parsed;

  return prisma.diaryEntry.create({
    data: {
      ...entryData,
      images: images
        ? {
            create: images.map((url) => ({ url })),
          }
        : undefined,
    },
    include: { images: true },
  });
}

export async function getDiaryById(id: string) {
  return prisma.diaryEntry.findUnique({
    where: { id },
    include: { images: true },
  });
}

export async function getDiaryList() {
  return prisma.diaryEntry.findMany({
    orderBy: { date: 'desc' },
    include: { images: true },
  });
}

export async function updateDiary(id: string, data: UpdateDiaryInput) {
  const parsed = UpdateDiarySchema.parse(data);
  const { images, ...entryData } = parsed;

  if (images !== undefined) {
    await prisma.diaryImage.deleteMany({
      where: { entryId: id },
    });
  }

  return prisma.diaryEntry.update({
    where: { id },
    data: {
      ...entryData,
      images:
        images !== undefined
          ? {
              create: images.map((url) => ({ url })),
            }
          : undefined,
    },
    include: { images: true },
  });
}

export async function deleteDiary(id: string) {
  await prisma.diaryEntry.delete({
    where: { id },
  });
}

export async function getDiaryNeighbors(id: string) {
  const current = await prisma.diaryEntry.findUnique({
    where: { id },
    select: { date: true },
  });

  if (!current) {
    return { prev: null, next: null };
  }

  const [prevEntry, nextEntry] = await Promise.all([
    prisma.diaryEntry.findFirst({
      where: { date: { lt: current.date } },
      orderBy: { date: 'desc' },
      select: { id: true },
    }),
    prisma.diaryEntry.findFirst({
      where: { date: { gt: current.date } },
      orderBy: { date: 'asc' },
      select: { id: true },
    }),
  ]);

  return {
    prev: prevEntry?.id ?? null,
    next: nextEntry?.id ?? null,
  };
}
