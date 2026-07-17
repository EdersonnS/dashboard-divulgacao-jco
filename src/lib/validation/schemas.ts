import { z } from "zod";
import { NETWORK_KEYS } from "@/lib/constants";

export const materiaInputSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório"),
  subtitulo: z.string().trim().min(1, "Subtítulo é obrigatório"),
  link: z.string().trim().url("Link inválido"),
  scheduledAt: z.string().min(1, "Data/hora é obrigatória"),
});

export type MateriaInput = z.infer<typeof materiaInputSchema>;

export const networkActionSchema = z.object({
  action: z.enum(["copy", "confirm", "unconfirm"]),
});

export const templateUpdateSchema = z.object({
  label: z.string().trim().min(1).optional(),
  templateText: z.string().min(1, "Texto do template é obrigatório"),
});

export const networkKeySchema = z.enum(NETWORK_KEYS);

export const historicoQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  networkKey: networkKeySchema.optional(),
  actor: z.string().optional(),
  eventType: z.string().optional(),
});
