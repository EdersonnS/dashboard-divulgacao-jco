"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { computeMateriaStatus } from "@/lib/status";
import { formatRelativeBR } from "@/lib/time";
import { MateriaStatusBadge } from "@/components/materias/MateriaStatusBadge";
import { WebhookStatusBadge } from "@/components/materias/WebhookStatusBadge";
import {
  NetworkCopyCard,
  type MateriaNetwork,
} from "@/components/materias/NetworkCopyCard";
import { Button } from "@/components/ui/Button";
import { LoadingBlock } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

interface MateriaDetail {
  id: number;
  titulo: string;
  subtitulo: string;
  link: string;
  scheduledAt: string;
  webhookStatus: "pending" | "success" | "failed";
  webhookLastError: string | null;
  firedAt: string | null;
  cancelledAt: string | null;
  createdBy: string;
  networks: MateriaNetwork[];
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("erro");
    return res.json();
  });

export default function MateriaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [resending, setResending] = useState(false);

  const {
    data: materia,
    isLoading,
    error,
    mutate,
  } = useSWR<MateriaDetail>(`/api/materias/${id}`, fetcher, {
    refreshInterval: 5000,
  });

  async function handleCancel() {
    if (!confirm("Cancelar esta matéria?")) return;
    await fetch(`/api/materias/${id}`, { method: "DELETE" });
    mutate();
  }

  async function handleResend() {
    setResending(true);
    try {
      await fetch(`/api/materias/${id}/resend-webhook`, { method: "POST" });
      mutate();
    } finally {
      setResending(false);
    }
  }

  if (isLoading) return <LoadingBlock />;

  if (error || !materia) {
    return (
      <EmptyState
        tone="error"
        title="Matéria não encontrada"
        description="Ela pode ter sido cancelada ou o endereço está incorreto."
        action={
          <Link href="/">
            <Button variant="secondary">Voltar ao painel</Button>
          </Link>
        }
      />
    );
  }

  const status = computeMateriaStatus(
    {
      cancelledAt: materia.cancelledAt,
      scheduledAt: materia.scheduledAt,
      webhookStatus: materia.webhookStatus,
    },
    materia.networks,
  );
  const editable = status === "agendada" || status === "atrasada";

  return (
    <div className="mx-auto max-w-5xl">
      <button
        onClick={() => router.push("/")}
        className="text-tinta-fraca hover:text-tinta mb-4 inline-flex min-h-[36px] items-center gap-1.5  text-xs"
      >
        <ArrowLeft size={14} strokeWidth={2.25} aria-hidden />
        Painel
      </button>

      <div className="bg-painel border-linha flex overflow-hidden rounded-lg border">
        <div
          className={`w-1.5 shrink-0 ${
            status === "atrasada"
              ? "bg-erro"
              : status === "divulgada"
                ? "bg-ok"
                : status === "agendada"
                  ? "bg-espera"
                  : "bg-linha-forte"
          }`}
          aria-hidden
        />
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/images/${materia.id}`}
              alt=""
              className="border-linha h-28 w-full shrink-0 rounded border object-cover sm:w-40"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl leading-tight font-bold text-balance sm:text-3xl">
                {materia.titulo}
              </h1>
              <p className="text-tinta-fraca mt-1.5 text-sm">{materia.subtitulo}</p>
              <a
                href={materia.link}
                target="_blank"
                rel="noreferrer"
                className="text-tinta-fraca hover:text-tinta mt-1 block truncate  text-xs underline underline-offset-2"
              >
                {materia.link}
              </a>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <MateriaStatusBadge status={status} />
                <WebhookStatusBadge status={materia.webhookStatus} />
                <span className="tabular text-tinta-fraca  text-xs">
                  {formatRelativeBR(materia.scheduledAt)} · {materia.createdBy}
                </span>
              </div>
              {materia.webhookLastError && (
                <p className="text-erro-ink mt-2  text-xs">
                  {materia.webhookLastError}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {materia.webhookStatus === "failed" && (
                  <Button size="sm" onClick={handleResend} disabled={resending}>
                    <RefreshCw size={14} strokeWidth={2.25} aria-hidden />
                    {resending ? "Reenviando" : "Reenviar"}
                  </Button>
                )}
                {editable && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => router.push(`/materias/${materia.id}/editar`)}
                  >
                    Editar
                  </Button>
                )}
                {status !== "cancelada" && (
                  <Button size="sm" variant="danger" onClick={handleCancel}>
                    Cancelar matéria
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-tinta-fraca mt-6 mb-2 px-1  text-[11px] font-semibold tracking-widest uppercase">
        Copiar e marcar
      </h2>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {materia.networks.map((n) => (
          <NetworkCopyCard
            key={n.networkKey}
            materiaId={materia.id}
            network={n}
            onChanged={() => mutate()}
          />
        ))}
      </div>
    </div>
  );
}
