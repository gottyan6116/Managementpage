import {
  PRIORITY_LABEL,
  PRIORITY_STYLE,
  STATUS_STYLE,
  statusLabel,
} from "@/lib/labels";
import type { Priority, ProjectStatus, TaskStatus } from "@/types/domain";

function Pill({
  children,
  fg,
  bg,
}: {
  children: React.ReactNode;
  fg: string;
  bg: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ color: fg, backgroundColor: bg }}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: TaskStatus | ProjectStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <Pill fg={s.fg} bg={s.bg}>
      {statusLabel(status)}
    </Pill>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const s = PRIORITY_STYLE[priority];
  return (
    <Pill fg={s.fg} bg={s.bg}>
      {PRIORITY_LABEL[priority]}
    </Pill>
  );
}

/** フェーズなど任意ラベルの淡色バッジ */
export function PhaseBadge({ label }: { label: string }) {
  return (
    <Pill fg="#475569" bg="#F1F5F9">
      {label}
    </Pill>
  );
}
