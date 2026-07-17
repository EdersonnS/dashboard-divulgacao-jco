import { NETWORK_LABELS, type NetworkKey } from "@/lib/constants";
import type { MateriaNetworkItem } from "./types";

/**
 * Cinco pontos = as cinco redes. Diz quanto falta divulgar sem abrir nada.
 * A ordem é sempre a mesma, então a posição carrega a informação.
 */
export function NetworkDots({ networks }: { networks: MateriaNetworkItem[] }) {
  const confirmed = networks.filter((n) => n.confirmed).length;
  const label = networks
    .map(
      (n) =>
        `${NETWORK_LABELS[n.networkKey as NetworkKey] ?? n.networkKey}: ${
          n.confirmed ? "divulgado" : "pendente"
        }`,
    )
    .join(", ");

  return (
    <span
      className="inline-flex items-center gap-1"
      title={label}
      aria-label={`${confirmed} de ${networks.length} redes divulgadas`}
    >
      {networks.map((n) => (
        <span
          key={n.networkKey}
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${
            n.confirmed ? "bg-ok" : "bg-linha-forte"
          }`}
        />
      ))}
    </span>
  );
}
