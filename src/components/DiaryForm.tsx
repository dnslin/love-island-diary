'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { createDiary } from '@/lib/actions';
import { useDiaryDraft } from '@/hooks/useDiaryDraft';
import { MoodSelector, type MoodValue } from './MoodSelector';
import { ImageUrlInput } from './ImageUrlInput';
import { validateDiaryForm } from './DiaryForm.validation';

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

export function DiaryForm() {
  const router = useRouter();
  const [form, setForm, clearDraft] = useDiaryDraft<DiaryFormData>(
    'diary-draft',
    defaultForm,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const updateField = useCallback(
    <K extends keyof DiaryFormData>(key: K, value: DiaryFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [setForm],
  );

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    const validation = validateDiaryForm(form);
    if (!validation.ok) {
      setError(validation.error!);
      return;
    }

    setSaving(true);
    try {
      const entry = await createDiary({
        date: new Date(form.date),
        title: form.title || undefined,
        content: form.content,
        mood: form.mood,
        images: form.images.length > 0 ? form.images : undefined,
      });
      clearDraft();
      setSuccess(true);
      setTimeout(() => {
        router.push(`/diary/${entry.id}`);
      }, 1500);
    } catch {
      setError('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {success && (
        <div className="px-4 py-3 rounded-lg bg-primary/20 text-text-main text-sm text-center">
          今天的心情已经收藏好了
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

      <input
        type="text"
        value={form.title}
        onChange={(e) => updateField('title', e.target.value)}
        placeholder="给今天起个名字（可选）"
        className="w-full px-3 py-2 rounded-lg border border-border-soft bg-card text-sm text-text-main"
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

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full py-3 rounded-lg bg-primary text-white font-medium disabled:opacity-50 mt-4"
      >
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  );
}
