"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Calendar,
  Send,
  Download,
  Copy,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { FeaturedKind } from "@/lib/status";
import { formatRelativeBR, formatTimeBR } from "@/lib/time";
import { copyToClipboard } from "@/lib/copy";
import { Button } from "@/components/ui/Button";
import { useCountdown, formatShort } from "./Countdown";
import { NetworkCopyCard } from "./NetworkCopyCard";
import type { MateriaListItem } from "./types";

/** Tela vazia é convite, não constatação. */
export function FeaturedEmpty() {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-xl font-bold">Agende a próxima matéria</p>
      <p className="text-tinta-media mt-1 max-w-sm text-sm">
        Nada entra no ar por enquanto. Quando houver uma matéria agendada, ela
        aparece aqui — e, na hora certa, vira a tarefa do momento.
      </p>
      <Link href="/materias/nova" className="mt-5">
        <Button>
          <Plus size={16} strokeWidth={2.25} aria-hidden />
          Nova matéria
        </Button>
      </Link>
    </div>
  );
}

function Chip({
  Icon,
  children,
}: {
  Icon: typeof Calendar;
  children: React.ReactNode;
}) {
  return (
    <span className="border-linha text-tinta-media inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium">
      <Icon size={13} strokeWidth={2} aria-hidden />
      {children}
    </span>
  );
}

/**
 * Modo "próxima" — resumo calmo do que vem a seguir: imagem, título, descrição
 * e horário. Sem destinos nem botões de ação: nada a executar por enquanto.
 */
function ProximaDivulgacao({ materia }: { materia: MateriaListItem }) {
  const { secondsRemaining } = useCountdown(materia.scheduledAt, materia.createdAt);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-marca-forte text-[11px] font-bold tracking-[0.12em] uppercase">
          Próxima divulgação
        </span>
        <Link href={`/materias/${materia.id}`}>
          <Button size="sm" variant="secondary">
            <ExternalLink size={13} strokeWidth={2} aria-hidden />
            Ver detalhes
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/images/${materia.id}`}
          alt=""
          className="border-linha h-32 w-full shrink-0 rounded-xl border object-cover sm:w-52"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl leading-snug font-bold text-balance sm:text-2xl">
            {materia.titulo}
          </h2>
          <p className="text-tinta-media mt-1.5 line-clamp-2 text-sm">
            {materia.subtitulo}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Chip Icon={Calendar}>{formatRelativeBR(materia.scheduledAt)}</Chip>
            <span className="border-marca-borda bg-marca-suave text-marca-forte tabular inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold">
              <Clock size={13} strokeWidth={2.25} aria-hidden />
              faltam {formatShort(Math.max(secondsRemaining, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modo "divulgando" — a hora chegou. A tela vira execução pura: imagem, título,
 * horário, download da imagem em destaque, os destinos para copiar e um único
 * botão grande para confirmar. Ao confirmar, a matéria conclui e a próxima assume.
 */
function DivulgacaoAtual({
  materia,
  onChanged,
}: {
  materia: MateriaListItem;
  onChanged: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const copiados = materia.networks.filter((n) => n.copied).length;

  async function handleResend() {
    await fetch(`/api/materias/${materia.id}/resend-webhook`, { method: "POST" });
    onChanged();
  }

  async function handleCopyAll() {
    const todos = materia.networks.map((n) => n.renderedText).join("\n\n———\n\n");
    await copyToClipboard(todos);
  }

  async function handleConfirmar() {
    setConfirming(true);
    try {
      await fetch(`/api/materias/${materia.id}/divulgar`, { method: "POST" });
      onChanged();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* cabeçalho: a tarefa de agora */}
      <div className="card border-erro/30 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-erro-ink inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase">
            <span className="relative flex h-2.5 w-2.5">
              <span className="bg-erro absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
              <span className="bg-erro relative inline-flex h-2.5 w-2.5 rounded-full" />
            </span>
            Divulgar agora
          </span>
          <span className="border-erro/30 bg-erro-suave text-erro-ink tabular inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-bold">
            <Clock size={14} strokeWidth={2.5} aria-hidden />
            {formatTimeBR(materia.scheduledAt)}
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/images/${materia.id}`}
            alt=""
            className="border-linha h-40 w-full shrink-0 rounded-xl border object-cover sm:w-60"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="text-xl leading-snug font-bold text-balance sm:text-2xl">
              {materia.titulo}
            </h2>
            <p className="text-tinta-media mt-1.5 line-clamp-2 text-sm">
              {materia.subtitulo}
            </p>
            <a
              href={`/api/images/${materia.id}?download=1`}
              download
              className="border-marca bg-marca-suave text-marca-forte hover:bg-marca-borda mt-4 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border-2 px-4 text-sm font-bold transition-colors sm:mt-auto sm:w-auto sm:self-start"
            >
              <Download size={18} strokeWidth={2.25} aria-hidden />
              Baixar imagem
            </a>
          </div>
        </div>

        {materia.webhookStatus === "failed" && (
          <div className="border-erro/20 bg-erro-suave mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <span className="text-erro-ink inline-flex items-center gap-1.5 text-xs font-medium">
              <AlertTriangle size={14} strokeWidth={2.25} aria-hidden />
              O envio automático falhou.
            </span>
            <button
              onClick={handleResend}
              className="text-erro-ink hover:bg-erro/10 inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 text-xs font-semibold"
            >
              <RefreshCw size={12} strokeWidth={2.25} aria-hidden />
              Reenviar
            </button>
          </div>
        )}
      </div>

      {/* destinos para copiar e postar */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-bold">
            <Send size={16} strokeWidth={2.25} className="text-marca" aria-hidden />
            Destinos
            <span className="text-tinta-fraca text-xs font-medium">
              {copiados}/{materia.networks.length} copiados
            </span>
          </h3>
          <Button size="sm" variant="secondary" onClick={handleCopyAll}>
            <Copy size={13} strokeWidth={2} aria-hidden />
            Copiar tudo
          </Button>
        </div>
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

      {/* ação final — grande e chamativa */}
      <button
        onClick={handleConfirmar}
        disabled={confirming}
        className="bg-marca hover:bg-marca-forte flex min-h-[60px] w-full items-center justify-center gap-2.5 rounded-2xl text-lg font-bold text-white shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CheckCircle2 size={24} strokeWidth={2.5} aria-hidden />
        {confirming ? "Confirmando..." : "Confirmar divulgação"}
      </button>
    </div>
  );
}

export function FeaturedMateria({
  materia,
  kind,
  onChanged,
}: {
  materia: MateriaListItem;
  kind: FeaturedKind;
  onChanged: () => void;
}) {
  if (kind === "divulgando") {
    return <DivulgacaoAtual materia={materia} onChanged={onChanged} />;
  }
  return <ProximaDivulgacao materia={materia} />;
}
