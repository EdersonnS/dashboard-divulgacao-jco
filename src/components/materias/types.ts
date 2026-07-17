export interface MateriaNetworkItem {
  networkKey: string;
  renderedText: string;
  confirmed: boolean;
  copied: boolean;
}

/** Shape de uma matéria retornada por GET /api/materias (usado na home). */
export interface MateriaListItem {
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
  createdAt: string;
  networks: MateriaNetworkItem[];
}
