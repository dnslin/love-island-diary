'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Input, Button } from 'animal-island-ui';
import { createDiary, updateDiary } from '@/lib/actions';
import { useDiaryDraft } from '@/hooks/useDiaryDraft';
import { MoodSelector, type MoodValue } from './MoodSelector';
import { ImageUrlInput } from './ImageUrlInput';
import { validateDiaryForm } from './DiaryForm.validation';
import type { DiaryEntry, DiaryImage } from '@prisma/client';

export interface DiaryFormData {
  date: string;
  title: string;
  content: string;
  mood: MoodValue;
  images: string[];
}

const defaultForm: DiaryFormData = {
  date: dayjs().format('YYYY-MM-DD'),
  title: '',
  content: '',
  mood: 'sweet',
  images: [],
};

export interface DiaryFormProps {
  mode?: 'create' | 'edit';
  initialData?: DiaryEntry & { images: DiaryImage[] };
  entryId?: string;
}

function entryToFormData(
  entry: DiaryEntry & { images: DiaryImage[] },
): DiaryFormData {
  return {
    date: dayjs(entry.date).format('YYYY-MM-DD'),
    title: entry.title ?? '',
    content: entry.content,
    mood: entry.mood as MoodValue,
    images: entry.images.map((img) => img.url),
  };
}

export function DiaryForm({
  mode = 'create',
  initialData,
  entryId,
}: DiaryFormProps) {
  const router = useRouter();
  const draftKey =
    mode === 'edit' && entryId
      ? `diary-draft-edit-${entryId}`
      : 'diary-draft';
  const initialForm =
    mode === 'edit' && initialData ? entryToFormData(initialData) : defaultForm;

  const [form, setForm, clearDraft] = useDiaryDraft<DiaryFormData>(
    draftKey,
    initialForm,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const updateField = useCallback(
    <K extends keyof DiaryFormData>(key: K, value: DiaryFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [setForm],
  );

  const handleSubmit = useCallback(async () => {
    setError('');
    setSuccess(false);

    const validation = validateDiaryForm(form);
    if (!validation.ok) {
      setError(validation.error!);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: new Date(form.date),
        title: form.title || undefined,
        content: form.content,
        mood: form.mood,
        images: form.images.length > 0 ? form.images : undefined,
      };

      if (mode === 'edit' && entryId) {
        await updateDiary(entryId, payload);
        clearDraft();
        setSuccess(true);
        timerRef.current = setTimeout(() => {
          router.push(`/diary/${entryId}`);
        }, 1500);
      } else {
        const entry = await createDiary(payload);
        clearDraft();
        setSuccess(true);
        timerRef.current = setTimeout(() => {
          router.push(`/diary/${entry.id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('保存日记失败:', err);
      setError('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }, [form, router, clearDraft, mode, entryId]);

  return (
    <div className="space-y-4">
      {success && (
        <div className="px-4 py-3 rounded-lg bg-primary/20 text-text-main text-sm text-center">
          {mode === 'edit' ? '修改已经收藏好了' : '今天的心情已经收藏好了'}
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="date"
          value={form.date}
          onChange={(e) => updateField('date', e.target.value)}
          className="px-3 py-2 rounded-lg border border-border-soft bg-card text-sm text-text-main"
        />
        <MoodSelector
          value={form.mood}
          onChange={(v) => updateField('mood', v)}
        />
      </div>

      <Input
        value={form.title}
        onChange={(e) => updateField('title', e.target.value)}
        placeholder="给今天起个名字（可选）"
      />

      <div className="relative">
        <textarea
          value={form.content}
          onChange={(e) => updateField('content', e.target.value)}
          placeholder="今天发生了什么？"
          rows={8}
          className="w-full px-3 py-2 rounded-lg border border-border-soft bg-card text-sm text-text-main resize-none"
          style={{ fontSize: '16px' }}
        />
        <span
          className={`absolute bottom-2 right-2 text-xs ${
            form.content.length > 10000 ? 'text-red-500' : 'text-text-sub'
          }`}
        >
          {form.content.length}/10000
        </span>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-text-sub">图片</label>
        <ImageUrlInput
          urls={form.images}
          onChange={(v) => updateField('images', v)}
        />
      </div>

      <Button
        type="primary"
        block
        loading={saving}
        disabled={saving}
        htmlType="button"
        onClick={handleSubmit}
      >
        保存
      </Button>
    </div>
  );
}
