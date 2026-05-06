'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'animal-island-ui';
import { deleteDiary } from '@/lib/actions';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface DeleteDiarySectionProps {
  entryId: string;
}

export function DeleteDiarySection({ entryId }: DeleteDiarySectionProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleOpen = useCallback(() => {
    setDeleteError('');
    setShowModal(true);
  }, []);

  const handleClose = useCallback(() => {
    if (deleting) return;
    setShowModal(false);
  }, [deleting]);

  const handleConfirm = useCallback(async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteDiary(entryId);
      setShowModal(false);
      router.push('/diary');
    } catch {
      setDeleteError('删除失败，日记可能已被删除');
      setDeleting(false);
    }
  }, [entryId, router]);

  return (
    <>
      <div className="mt-6 pt-4 border-t border-border-soft">
        <Button danger block onClick={handleOpen}>
          删除这篇日记
        </Button>
      </div>

      <DeleteConfirmModal
        open={showModal}
        onClose={handleClose}
        onConfirm={handleConfirm}
        loading={deleting}
      />

      {deleteError && (
        <div className="mt-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
          {deleteError}
        </div>
      )}
    </>
  );
}
