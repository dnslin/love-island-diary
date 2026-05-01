import { z } from 'zod';

export const CreateDiarySchema = z.object({
  date: z.coerce.date(),
  title: z.string().max(200).optional(),
  content: z.string().max(10000),
  mood: z.string().max(20).default('sweet'),
  weather: z.string().max(20).optional(),
  images: z.array(z.string().url()).optional(),
});

export type CreateDiaryInput = z.infer<typeof CreateDiarySchema>;

export const UpdateDiarySchema = CreateDiarySchema.partial();
export type UpdateDiaryInput = z.infer<typeof UpdateDiarySchema>;

export const CoupleProfileSchema = z.object({
  personAName: z.string().min(1).max(50),
  personBName: z.string().min(1).max(50),
  anniversaryDate: z.coerce.date(),
  siteTitle: z.string().max(100).optional(),
});

export type CoupleProfileInput = z.infer<typeof CoupleProfileSchema>;
