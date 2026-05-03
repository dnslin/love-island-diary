export interface DiaryFormData {
  date: string;
  title: string;
  content: string;
  mood: string;
  images: string[];
}

export function validateDiaryForm(
  data: DiaryFormData,
): { ok: boolean; error?: string } {
  if (!data.content.trim()) {
    return { ok: false, error: '写点什么吧' };
  }
  if (data.content.length > 10000) {
    return { ok: false, error: '正文太长了，最多 10000 字' };
  }
  return { ok: true };
}
