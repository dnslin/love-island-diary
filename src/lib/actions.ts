'use server';

import { prisma } from './prisma';
import {
  CreateDiarySchema,
  UpdateDiarySchema,
  CoupleProfileSchema,
  type CreateDiaryInput,
  type UpdateDiaryInput,
  type CoupleProfileInput,
} from './schemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import dayjs from 'dayjs';
import { timingSafeEqual } from 'crypto';
import { signAuthToken, requireAdmin } from './auth';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function createDiary(data: CreateDiaryInput) {
  const authError = await requireAdmin();
  if (authError) return authError;

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
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    include: { images: true },
  });
}

export async function updateDiary(id: string, data: UpdateDiaryInput) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = UpdateDiarySchema.parse(data);
  const { images, ...entryData } = parsed;

  return prisma.$transaction(async (tx) => {
    if (images !== undefined) {
      await tx.diaryImage.deleteMany({
        where: { entryId: id },
      });
    }

    return tx.diaryEntry.update({
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
  });
}

export async function deleteDiary(id: string) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await prisma.diaryEntry.delete({
    where: { id },
  });
}

export async function getDiaryNeighbors(id: string) {
  const current = await prisma.diaryEntry.findUnique({
    where: { id },
    select: { date: true, createdAt: true },
  });

  if (!current) {
    return { prev: null, next: null };
  }

  const [prevEntry, nextEntry] = await Promise.all([
    prisma.diaryEntry.findFirst({
      where: {
        OR: [
          { date: { lt: current.date } },
          {
            AND: [
              { date: { equals: current.date } },
              { createdAt: { lt: current.createdAt } },
            ],
          },
        ],
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    }),
    prisma.diaryEntry.findFirst({
      where: {
        OR: [
          { date: { gt: current.date } },
          {
            AND: [
              { date: { equals: current.date } },
              { createdAt: { gt: current.createdAt } },
            ],
          },
        ],
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    }),
  ]);

  return {
    prev: prevEntry?.id ?? null,
    next: nextEntry?.id ?? null,
  };
}

export async function getCoupleProfile() {
  return prisma.coupleProfile.findFirst();
}

export async function updateCoupleProfile(data: CoupleProfileInput) {
  const parsed = CoupleProfileSchema.parse(data);

  return prisma.coupleProfile.upsert({
    where: { id: 'profile' },
    update: parsed,
    create: { ...parsed, id: 'profile' },
  });
}

export async function getCoverStats() {
  const [diaryCount, memoryCount] = await Promise.all([
    prisma.diaryEntry.count(),
    prisma.diaryImage.count(),
  ]);
  return { diaryCount, memoryCount };
}

export async function getAllDiaryImages() {
  return prisma.diaryImage.findMany({
    orderBy: {
      entry: { date: 'desc' },
    },
    include: { entry: { select: { id: true, date: true, title: true } } },
  });
}

export type SettingsFormState = {
  ok: boolean;
  fieldErrors?: Partial<
    Record<'personAName' | 'personBName' | 'anniversaryDate' | 'siteTitle', string>
  >;
  formError?: string;
};

const SettingsActionSchema = z.object({
  personAName: z
    .string()
    .trim()
    .min(1, '请填写第一位的昵称')
    .max(50, '不超过 50 字'),
  personBName: z
    .string()
    .trim()
    .min(1, '请填写第二位的昵称')
    .max(50, '不超过 50 字'),
  anniversaryDate: z.coerce
    .date({ error: '请选择日期' })
    .refine(
      (d) =>
        dayjs(d).startOf('day').valueOf() <= dayjs().endOf('day').valueOf(),
      '在一起日期不能晚于今天',
    ),
  siteTitle: z
    .string()
    .trim()
    .max(100, '不超过 100 字')
    .transform((v) => (v.length ? v : null))
    .optional(),
});

function zodIssuesToFieldErrors(
  error: z.ZodError,
): SettingsFormState['fieldErrors'] {
  const fieldErrors: SettingsFormState['fieldErrors'] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (
      typeof key === 'string' &&
      ['personAName', 'personBName', 'anniversaryDate', 'siteTitle'].includes(key)
    ) {
      const k = key as keyof NonNullable<SettingsFormState['fieldErrors']>;
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
  }
  return fieldErrors;
}

export async function saveCoupleProfileAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const profile = await getCoupleProfile();
  if (profile) {
    const authError = await requireAdmin();
    if (authError) {
      return { ok: false, formError: authError.error };
    }
  }

  const parsed = SettingsActionSchema.safeParse({
    personAName: formData.get('personAName'),
    personBName: formData.get('personBName'),
    anniversaryDate: formData.get('anniversaryDate'),
    siteTitle: formData.get('siteTitle'),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodIssuesToFieldErrors(parsed.error) };
  }

  try {
    await updateCoupleProfile(parsed.data);
  } catch {
    return { ok: false, formError: '保存失败,请稍后重试' };
  }

  revalidatePath('/');
  redirect('/');
}

export async function verifyViewPassword(
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (safeCompare(password, process.env.VIEW_PASSWORD ?? '')) {
    await signAuthToken('viewer');
    return { ok: true };
  }
  return { ok: false, error: '密码错误，请重试' };
}

export async function verifyAdminPassword(
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (safeCompare(password, process.env.ADMIN_PASSWORD ?? '')) {
    await signAuthToken('admin');
    return { ok: true };
  }
  return { ok: false, error: '密码错误，请重试' };
}
