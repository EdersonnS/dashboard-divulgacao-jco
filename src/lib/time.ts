import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { TIMEZONE } from "./constants";

/**
 * Converte o valor de um <input type="datetime-local"> (ex: "2026-07-20T14:30"),
 * interpretado como horário de America/Sao_Paulo, para um Date UTC para salvar no banco.
 */
export function parseLocalDateTimeToUtc(datetimeLocalValue: string): Date {
  return fromZonedTime(datetimeLocalValue, TIMEZONE);
}

/**
 * Combina os valores de um <input type="date"> ("2026-07-20") e um
 * <input type="time"> ("14:30") no formato que a API espera (scheduledAt).
 */
export function combineDateTime(dateValue: string, timeValue: string): string {
  return `${dateValue}T${timeValue}`;
}

/** Data (SP) no formato do <input type="date">: "yyyy-MM-dd". */
export function formatDateInputValue(date: Date | string): string {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd");
}

/** Hora (SP) no formato do <input type="time">: "HH:mm". */
export function formatTimeInputValue(date: Date | string): string {
  return formatInTimeZone(date, TIMEZONE, "HH:mm");
}

/** Data/hora atuais (SP) para pré-preencher o formulário de nova matéria. */
export function nowDateInputValue(): string {
  return formatDateInputValue(new Date());
}

export function nowTimeInputValue(): string {
  return formatTimeInputValue(new Date());
}

/** Data brasileira legível: "17/07/2026". */
export function formatDateBR(date: Date | string): string {
  return formatInTimeZone(date, TIMEZONE, "dd/MM/yyyy");
}

/** Hora brasileira legível: "14:30". */
export function formatTimeBR(date: Date | string): string {
  return formatInTimeZone(date, TIMEZONE, "HH:mm");
}

/** Data + hora legível (não-relativa): "17/07/2026 às 14:30". */
export function formatDateTimeBR(date: Date | string): string {
  return `${formatDateBR(date)} às ${formatTimeBR(date)}`;
}

/**
 * Horário em linguagem natural relativa ao dia atual (SP):
 * "hoje às 14:30", "amanhã às 09:00", "ontem às 08:00" ou, para datas mais
 * distantes, "17/07/2026 às 14:30".
 */
export function formatRelativeBR(date: Date | string, now: Date = new Date()): string {
  const targetDay = formatDateInputValue(date); // yyyy-MM-dd em SP
  const todayDay = formatDateInputValue(now);
  const hora = formatTimeBR(date);

  if (targetDay === todayDay) return `hoje às ${hora}`;

  // diferença em dias de calendário (SP), evitando problemas de fuso
  const target = new Date(`${targetDay}T00:00:00`);
  const today = new Date(`${todayDay}T00:00:00`);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 1) return `amanhã às ${hora}`;
  if (diffDays === -1) return `ontem às ${hora}`;

  return `${formatDateBR(date)} às ${hora}`;
}

/**
 * Formata um timestamp (UTC) para o valor de um <input type="datetime-local">
 * em America/Sao_Paulo (mantido por compatibilidade).
 */
export function toDateTimeLocalValue(date: Date | string): string {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}
