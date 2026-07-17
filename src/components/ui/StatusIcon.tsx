import { Radio, Clock, Check, Ban } from "lucide-react";
import type { StatusMeta } from "@/lib/status";

const ICONS = {
  radio: Radio,
  clock: Clock,
  check: Check,
  slash: Ban,
} as const;

export function StatusIcon({
  icon,
  className = "",
  size = 14,
}: {
  icon: StatusMeta["icon"];
  className?: string;
  size?: number;
}) {
  const Icon = ICONS[icon];
  return <Icon size={size} strokeWidth={2.25} className={className} aria-hidden />;
}
