import { Modal, Button } from 'animal-island-ui';

export interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  loading = false,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      open={open}
      title="要删除这篇日记吗？"
      maskClosable={!loading}
      closable={!loading}
      onClose={onClose}
      typewriter={false}
      footer={
        <div className="flex gap-3 justify-end">
          <Button disabled={loading} onClick={onClose}>
            取消
          </Button>
          <Button danger loading={loading} disabled={loading} onClick={onConfirm}>
            {loading ? '删除中...' : '删除'}
          </Button>
        </div>
      }
    >
      <p className="text-text-sub text-sm">删除后就不能在这里看到它了</p>
    </Modal>
  );
}
