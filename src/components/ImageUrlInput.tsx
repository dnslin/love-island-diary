'use client';

import { useState } from 'react';

interface ImageUrlInputProps {
  urls: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUrlInput({ urls, onChange }: ImageUrlInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const addUrl = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      onChange([...urls, trimmed]);
      setInput('');
      setError('');
    } catch {
      setError('请输入有效的图片地址');
    }
  };

  const removeUrl = (index: number) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {urls.map((url, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="flex-1 text-sm text-text-sub truncate">{url}</span>
          <button
            type="button"
            onClick={() => removeUrl(index)}
            className="text-sm text-accent hover:text-text-main"
          >
            删除
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="粘贴图片链接"
          className="flex-1 px-3 py-2 rounded-lg border border-border-soft bg-card text-sm"
        />
        <button
          type="button"
          onClick={addUrl}
          className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium"
        >
          添加
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
