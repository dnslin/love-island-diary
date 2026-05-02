'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Input, Button } from 'animal-island-ui';
import dayjs from 'dayjs';
import {
  saveCoupleProfileAction,
  type SettingsFormState,
} from '@/lib/actions';

type Props = {
  initial: {
    personAName: string;
    personBName: string;
    anniversaryDate: Date;
    siteTitle: string | null;
  } | null;
};

const INITIAL_STATE: SettingsFormState = { ok: true };

export default function SettingsForm({ initial }: Props) {
  const [state, formAction, pending] = useActionState(
    saveCoupleProfileAction,
    INITIAL_STATE,
  );

  const isEdit = initial !== null;
  const today = dayjs().format('YYYY-MM-DD');
  const dateInputClass =
    'w-full h-10 px-3 rounded-lg border border-border-soft bg-card text-text-main outline-none focus:border-accent';

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-[480px]">
        <h1 className="text-2xl font-bold text-text-main">
          {isEdit ? '修改情侣信息' : '告诉我们一些关于你们的事'}
        </h1>
        <p className="text-sm text-text-sub mt-2 mb-8">
          {isEdit ? '调整后保存,封面会立即更新' : '先留下你们的基本信息'}
        </p>

        {state.formError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">
            {state.formError}
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <div>
            <label
              htmlFor="personAName"
              className="block text-sm text-text-sub mb-1.5"
            >
              Ta 的昵称
            </label>
            <Input
              id="personAName"
              name="personAName"
              defaultValue={initial?.personAName ?? ''}
              maxLength={50}
              required
              status={state.fieldErrors?.personAName ? 'error' : undefined}
              disabled={pending}
            />
            {state.fieldErrors?.personAName && (
              <p className="text-xs text-red-500 mt-1">
                {state.fieldErrors.personAName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="personBName"
              className="block text-sm text-text-sub mb-1.5"
            >
              你的昵称
            </label>
            <Input
              id="personBName"
              name="personBName"
              defaultValue={initial?.personBName ?? ''}
              maxLength={50}
              required
              status={state.fieldErrors?.personBName ? 'error' : undefined}
              disabled={pending}
            />
            {state.fieldErrors?.personBName && (
              <p className="text-xs text-red-500 mt-1">
                {state.fieldErrors.personBName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="anniversaryDate"
              className="block text-sm text-text-sub mb-1.5"
            >
              在一起的日期
            </label>
            <input
              type="date"
              id="anniversaryDate"
              name="anniversaryDate"
              defaultValue={
                initial
                  ? dayjs(initial.anniversaryDate).format('YYYY-MM-DD')
                  : ''
              }
              max={today}
              required
              disabled={pending}
              className={dateInputClass}
            />
            {state.fieldErrors?.anniversaryDate && (
              <p className="text-xs text-red-500 mt-1">
                {state.fieldErrors.anniversaryDate}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="siteTitle"
              className="block text-sm text-text-sub mb-1.5"
            >
              网站标题（可选）
            </label>
            <Input
              id="siteTitle"
              name="siteTitle"
              defaultValue={initial?.siteTitle ?? ''}
              maxLength={100}
              placeholder="恋爱小岛日记"
              status={state.fieldErrors?.siteTitle ? 'error' : undefined}
              disabled={pending}
            />
            {state.fieldErrors?.siteTitle && (
              <p className="text-xs text-red-500 mt-1">
                {state.fieldErrors.siteTitle}
              </p>
            )}
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={pending}
            disabled={pending}
          >
            保存
          </Button>
        </form>

        {isEdit && (
          <Link
            href="/"
            className="text-center mt-4 block text-sm text-text-sub hover:text-text-main"
          >
            取消
          </Link>
        )}
      </div>
    </div>
  );
}
