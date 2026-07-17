"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Clock, Pencil, Trash2 } from "lucide-react";
import { computeMateriaStatus, STATUS_META } from "@/lib/status";
import { formatTimeBR, formatRelativeBR } from "@/lib/time";
import { StatusIcon } from "@/components/ui/StatusIcon";
import { NetworkCopyCard } from "./NetworkCopyCard";
import { NetworkDots } from "./NetworkDots";
import type { MateriaListItem } from "./types";

/** Uma linha da linha do tempo: hora, status, manchete, destinos e ações. */
export function MateriaCard({
  materia,
  onChanged,
}: {
  materia: MateriaListItem;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const status = computeMateriaStatus(
    {
      cancelledAt: materia.cancelledAt,
      scheduledAt: materia.scheduledAt,
      webhookStatus: materia.webhookStatus,
    },
    materia.networks,
  );
  const meta = STATUS_META[status];
  const editable = status === "agendada" || status === "atrasada";
  const confirmados = materia.networks.filter((n) => n.confirmed).length;

  // etiqueta de horário color-codeada: o olho encontra na hora "qual matéria, que horas"
  const timeTone =
    status === "atrasada"
      ? "border-erro/30 bg-erro-suave text-erro-ink"
      : status === "divulgada"
        ? "border-ok/30 bg-ok-suave text-ok-ink"
        : status === "cancelada"
          ? "border-linha bg-canvas text-tinta-fraca"
          : "border-linha-forte bg-canvas text-tinta";

  async function handleCancel() {
    if (!confirm(`Cancelar "${materia.titulo}"?`)) return;
    await fetch(`/api/materias/${materia.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="border-linha border-b last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={`shrink-0 ${meta.inkClass}`}>
          <StatusIcon icon={meta.icon} size={16} />
        </span>

        <div className="min-w-0 flex-1">
          <Link
            href={`/materias/${materia.id}`}
            className="hover:text-marca-forte block truncate text-sm font-medium transition-colors"
          >
            {materia.titulo}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}
            >
              {meta.label}
            </span>
            {confirmados > 0 && (
              <span className="bg-info-suave text-info-ink rounded-md px-1.5 py-0.5 text-[11px] font-medium">
                {confirmados} de {materia.networks.length} destinos
              </span>
            )}
            <NetworkDots networks={materia.networks} />
            <span className="text-tinta-fraca hidden text-[11px] sm:inline">
              {materia.createdBy}
            </span>
          </div>
        </div>

        {/* etiqueta de horário — à direita, destacada */}
        <span
          className={`tabular inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-bold ${timeTone}`}
          title={formatRelativeBR(materia.scheduledAt)}
        >
          <Clock size={13} strokeWidth={2.5} aria-hidden />
          {formatTimeBR(materia.scheduledAt)}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Ocultar destinos" : "Ver destinos"}
            className="text-tinta-fraca hover:bg-canvas hover:text-tinta flex h-11 w-11 items-center justify-center rounded-lg"
          >
            {expanded ? (
              <ChevronUp size={16} strokeWidth={2.25} aria-hidden />
            ) : (
              <ChevronDown size={16} strokeWidth={2.25} aria-hidden />
            )}
          </button>
          {editable && (
            <button
              onClick={() => router.push(`/materias/${materia.id}/editar`)}
              className="border-linha text-tinta-media hover:bg-canvas hover:text-tinta hidden h-11 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium sm:flex"
            >
              <Pencil size={13} strokeWidth={2} aria-hidden />
              Editar
            </button>
          )}
          {status !== "cancelada" && (
            <button
              onClick={handleCancel}
              aria-label="Cancelar matéria"
              className="border-linha text-tinta-fraca hover:bg-erro-suave hover:text-erro-ink hidden h-11 w-11 items-center justify-center rounded-lg border sm:flex"
            >
              <Trash2 size={14} strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="bg-canvas border-linha border-t p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {materia.networks.map((n) => (
              <NetworkCopyCard
                key={n.networkKey}
                materiaId={materia.id}
                network={n}
                onChanged={onChanged}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
