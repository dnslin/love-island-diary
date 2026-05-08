import { Modal } from 'animal-island-ui';
import Link from 'next/link';
import dayjs from '@/lib/dayjs';

interface DayEntriesModalProps {
  open: boolean;
  date: string;
  entries: Array<{ id: string; title: string | null }>;
  onClose: () => void;
}

export function DayEntriesModal({
  open,
  date,
  entries,
  onClose,
}: DayEntriesModalProps) {
  if (!open || !date) return null;

  const label = dayjs(date).format('M月D日');

  return (
    <Modal
      open={open}
      title={`${label}的日记`}
      maskClosable
      closable
      onClose={onClose}
      typewriter={false}
      footer={null}
    >
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/diary/${entry.id}`}
              onClick={onClose}
              className="block p-3 rounded-lg bg-cream hover:bg-primary/10 transition-colors text-text-main text-sm"
            >
              {entry.title || `${label} 的心情`}
            </Link>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
