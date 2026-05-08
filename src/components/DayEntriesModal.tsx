interface DayEntriesModalProps {
  open: boolean;
  date: string;
  entries: Array<{ id: string; title: string | null }>;
  onClose: () => void;
}

export function DayEntriesModal(_props: DayEntriesModalProps) {
  return null;
}
