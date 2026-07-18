"use client";

import { MateriaCard } from "./MateriaCard";
import type { MateriaListItem } from "./types";

export type { MateriaListItem };

/**
 * Linha do tempo — a agenda em ordem cronológica CRESCENTE: a próxima a ir ao ar
 * fica no topo e as agendadas para mais tarde vão para o fim. Assim, cada matéria
 * nova (agendada para depois) entra no fim da lista, não no começo.
 */
export function MateriaList({
  materias,
  onChanged,
}: {
  materias: MateriaListItem[];
  onChanged: () => void;
}) {
  const ordenadas = [...materias].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <div className="card overflow-hidden">
      {ordenadas.map((m) => (
        <MateriaCard key={m.id} materia={m} onChanged={onChanged} />
      ))}
    </div>
  );
}
