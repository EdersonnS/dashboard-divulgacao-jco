import { Check, AlertTriangle, Loader } from "lucide-react";

type WebhookStatus = "pending" | "success" | "failed";

/*
  "Webhook" nomeia o encanamento. A equipe não gerencia webhook — gerencia o
  envio automático que substituiu o post manual no Telegram.
*/
const STYLES: Record<
  WebhookStatus,
  { label: string; Icon: typeof Check; className: string }
> = {
  pending: {
    label: "Envio automático · na fila",
    Icon: Loader,
    className: "bg-canvas text-tinta-fraca border-linha",
  },
  success: {
    label: "Envio automático · enviado",
    Icon: Check,
    className: "bg-ok-suave text-ok-ink border-ok/20",
  },
  failed: {
    label: "Envio automático · falhou",
    Icon: AlertTriangle,
    className: "bg-erro-suave text-erro-ink border-erro/20",
  },
};

export function WebhookStatusBadge({ status }: { status: WebhookStatus }) {
  const { label, Icon, className } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5  text-[11px] font-medium ${className}`}
    >
      <Icon size={12} strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  );
}
