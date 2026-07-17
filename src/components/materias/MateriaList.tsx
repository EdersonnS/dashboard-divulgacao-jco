"use client";

import { MateriaCard } from "./MateriaCard";
import type { MateriaListItem } from "./types";

export type { MateriaListItem };

/**
 * Linha do tempo — as matérias em ordem de horário, do que exige ação para o
 * que já passou. O agrupamento por estado saiu: o ícone e o badge de cada linha
 * já dizem o estado, e a ordem cronológica é como a redação pensa.
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
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );

  return (
    <div className="card overflow-hidden">
      {ordenadas.map((m) => (
        <MateriaCard key={m.id} materia={m} onChanged={onChanged} />
      ))}
    </div>
  );
}
