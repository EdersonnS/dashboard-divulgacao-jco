import type { MateriaStatus } from "@/lib/status";
import { STATUS_META } from "@/lib/status";
import { StatusIcon } from "@/components/ui/StatusIcon";

export function MateriaStatusBadge({ status }: { status: MateriaStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] font-medium tracking-wide uppercase ${meta.badgeClass}`}
    >
      <StatusIcon icon={meta.icon} size={12} />
      {meta.label}
    </span>
  );
}
