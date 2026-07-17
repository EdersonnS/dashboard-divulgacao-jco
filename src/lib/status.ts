export type MateriaStatus = "cancelada" | "divulgada" | "atrasada" | "agendada";

export interface MateriaStatusInput {
  cancelledAt: Date | string | null;
  scheduledAt: Date | string;
  webhookStatus: "pending" | "success" | "failed";
}

export interface NetworkConfirmedInput {
  confirmed: boolean;
}

export function computeMateriaStatus(
  materia: MateriaStatusInput,
  networks: NetworkConfirmedInput[],
  now: Date = new Date(),
): MateriaStatus {
  if (materia.cancelledAt) return "cancelada";

  const allConfirmed =
    networks.length > 0 && networks.every((n) => n.confirmed);

  // "Divulgada" = distribuição manual concluída (todos os destinos confirmados).
  // O envio automático (webhook) é um canal à parte, com status próprio — ele não
  // trava a conclusão manual. É isso que o botão "Confirmar divulgação" faz: ao
  // marcar todos os destinos, a matéria sai do foco e a próxima assume o lugar.
  if (allConfirmed) {
    return "divulgada";
  }

  const scheduledAt = new Date(materia.scheduledAt);
  if (scheduledAt <= now) {
    return "atrasada";
  }

  return "agendada";
}

/**
 * Metadados visuais de cada status — fonte única de verdade.
 * Status é comunicado por cor E texto E ícone (nunca só por cor).
 *
 * `signal` é o preenchimento saturado (trilho de tally, ponto); `ink` é o texto
 * escurecido para contraste AA sobre fundo claro; `tint` é o fundo da faixa.
 */
export interface StatusMeta {
  label: string;
  /** nome do ícone lucide correspondente (ver components/ui/StatusIcon) */
  icon: "radio" | "clock" | "check" | "slash";
  signalClass: string;
  inkClass: string;
  tintClass: string;
  borderClass: string;
  badgeClass: string;
}

export const STATUS_META: Record<MateriaStatus, StatusMeta> = {
  atrasada: {
    label: "Atrasada",
    icon: "radio",
    signalClass: "bg-erro",
    inkClass: "text-erro-ink",
    tintClass: "bg-erro-suave",
    borderClass: "border-erro",
    badgeClass: "bg-erro-suave text-erro-ink border-erro/20",
  },
  agendada: {
    label: "Agendada",
    icon: "clock",
    signalClass: "bg-espera",
    inkClass: "text-espera-ink",
    tintClass: "bg-espera-suave",
    borderClass: "border-espera",
    badgeClass: "bg-espera-suave text-espera-ink border-espera/20",
  },
  divulgada: {
    label: "Divulgada",
    icon: "check",
    signalClass: "bg-ok",
    inkClass: "text-ok-ink",
    tintClass: "bg-ok-suave",
    borderClass: "border-ok",
    badgeClass: "bg-ok-suave text-ok-ink border-ok/20",
  },
  cancelada: {
    label: "Cancelada",
    icon: "slash",
    signalClass: "bg-linha-forte",
    inkClass: "text-tinta-fraca",
    tintClass: "bg-canvas",
    borderClass: "border-linha",
    badgeClass: "bg-canvas text-tinta-fraca border-linha",
  },
};

/** Ordem de urgência para agrupar/ordenar a lista da home. */
export const STATUS_ORDER: MateriaStatus[] = [
  "atrasada",
  "agendada",
  "divulgada",
  "cancelada",
];

export interface FeaturedCandidate {
  cancelledAt: Date | string | null;
  scheduledAt: Date | string;
  webhookStatus: "pending" | "success" | "failed";
  networks: NetworkConfirmedInput[];
}

export type FeaturedKind = "divulgando" | "proxima";

/**
 * Escolhe a matéria de destaque da home:
 *  1. "divulgando" — a mais atrasada entre as que já passaram do horário e
 *     ainda não foram totalmente divulgadas (a que exige ação AGORA);
 *  2. "proxima"   — senão, a próxima agendada (menor scheduledAt futuro);
 *  3. null        — senão, nada a fazer (mostra convite para criar).
 */
export function pickFeaturedMateria<T extends FeaturedCandidate>(
  materias: T[],
  now: Date = new Date(),
): { materia: T; kind: FeaturedKind } | null {
  const actionable = materias.filter((m) => {
    const status = computeMateriaStatus(m, m.networks, now);
    return status === "atrasada" || status === "agendada";
  });

  const overdue = actionable
    .filter((m) => new Date(m.scheduledAt) <= now)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  if (overdue.length > 0) {
    return { materia: overdue[0], kind: "divulgando" };
  }

  const upcoming = actionable
    .filter((m) => new Date(m.scheduledAt) > now)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  if (upcoming.length > 0) {
    return { materia: upcoming[0], kind: "proxima" };
  }

  return null;
}
