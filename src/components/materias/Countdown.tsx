"use client";

import { useEffect, useState } from "react";

export interface CountdownState {
  /** true quando o horário já chegou/passou */
  live: boolean;
  /** relógio grande — "17:08", "01:42" ou "3d 04h" */
  clock: string;
  /** rótulo do card */
  title: string;
  /** linha de apoio — "faltam" / "no ar há" */
  caption: string;
  /** 0..1 — quanto do caminho até o horário já passou (para o anel) */
  progress: number;
  /** segundos até o horário (negativo se já entrou) */
  secondsRemaining: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

function formatClock(totalSec: number): string {
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (days >= 1) return `${days}d ${pad(hours)}h`;
  if (hours >= 1) return `${hours}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

/** Versão curta para a linha de apoio: "01m 42s", "2h 13m". */
export function formatShort(totalSec: number): string {
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (days >= 1) return `${days}d ${pad(hours)}h`;
  if (hours >= 1) return `${hours}h ${pad(mins)}m`;
  return `${pad(mins)}m ${pad(secs)}s`;
}

/**
 * Antes do horário conta para baixo; depois, conta para cima — quando já entrou,
 * o dado que importa é há quanto tempo está no ar sem ter sido divulgado.
 *
 * `createdAt` serve de início da régua de progresso do anel/barra.
 */
export function computeCountdown(
  scheduledAt: string,
  now: number,
  createdAt?: string,
): CountdownState {
  const target = new Date(scheduledAt).getTime();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return {
      live: true,
      clock: formatClock(Math.floor(Math.abs(diffMs) / 1000)),
      title: "No ar desde",
      caption: "no ar há",
      progress: 1,
      secondsRemaining: Math.floor(diffMs / 1000),
    };
  }

  const start = createdAt ? new Date(createdAt).getTime() : target - 60 * 60 * 1000;
  const span = Math.max(target - start, 1);
  const progress = Math.min(Math.max((now - start) / span, 0), 1);

  return {
    live: false,
    clock: formatClock(Math.floor(diffMs / 1000)),
    title: "Tempo para entrar",
    caption: "faltam",
    progress,
    secondsRemaining: Math.floor(diffMs / 1000),
  };
}

export function useCountdown(scheduledAt: string, createdAt?: string): CountdownState {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return computeCountdown(scheduledAt, now, createdAt);
}

/** Contador inline compacto (linha do tempo). */
export function Countdown({ scheduledAt }: { scheduledAt: string }) {
  const { live, clock, caption } = useCountdown(scheduledAt);
  return (
    <span
      className={`tabular text-sm font-medium ${live ? "text-erro-ink" : "text-tinta"}`}
    >
      {clock} <span className="text-tinta-fraca font-normal">{caption}</span>
    </span>
  );
}
