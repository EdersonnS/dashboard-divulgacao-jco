import { NETWORK_LABELS, type NetworkKey } from "@/lib/constants";
import { formatDateTimeBR } from "@/lib/time";

export interface ActivityLogRow {
  id: number;
  eventType: string;
  materiaId: number | null;
  networkKey: NetworkKey | null;
  actor: string;
  createdAt: string;
}

export function HistoricoTable({ rows }: { rows: ActivityLogRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-tinta-fraca">Nenhum evento encontrado para os filtros selecionados.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-linha bg-painel">
      <table className="min-w-full divide-y divide-linha text-sm">
        <thead className="bg-canvas">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-tinta-fraca">Quando</th>
            <th className="px-4 py-2 text-left font-medium text-tinta-fraca">Evento</th>
            <th className="px-4 py-2 text-left font-medium text-tinta-fraca">Matéria</th>
            <th className="px-4 py-2 text-left font-medium text-tinta-fraca">Rede</th>
            <th className="px-4 py-2 text-left font-medium text-tinta-fraca">Usuário</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-linha">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-2 whitespace-nowrap text-tinta">
                {formatDateTimeBR(row.createdAt)}
              </td>
              <td className="px-4 py-2 text-tinta">{row.eventType}</td>
              <td className="px-4 py-2 text-tinta">
                {row.materiaId ?? "-"}
              </td>
              <td className="px-4 py-2 text-tinta">
                {row.networkKey ? NETWORK_LABELS[row.networkKey] : "-"}
              </td>
              <td className="px-4 py-2 text-tinta">{row.actor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
