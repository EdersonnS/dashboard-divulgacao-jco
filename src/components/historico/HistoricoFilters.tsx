"use client";

import { NETWORK_KEYS, NETWORK_LABELS } from "@/lib/constants";

export interface HistoricoFiltersValue {
  dateFrom: string;
  dateTo: string;
  networkKey: string;
  actor: string;
  eventType: string;
}

const EVENT_TYPES = [
  "materia_created",
  "materia_edited",
  "materia_cancelled",
  "materia_divulgada",
  "network_copied",
  "network_confirmed",
  "network_unconfirmed",
  "webhook_fired",
  "webhook_failed",
  "webhook_resent",
  "template_updated",
];

export function HistoricoFilters({
  value,
  onChange,
}: {
  value: HistoricoFiltersValue;
  onChange: (value: HistoricoFiltersValue) => void;
}) {
  function set<K extends keyof HistoricoFiltersValue>(key: K, v: string) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-linha bg-painel p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-tinta-fraca">De</label>
        <input
          type="date"
          value={value.dateFrom}
          onChange={(e) => set("dateFrom", e.target.value)}
          className="rounded-md border border-linha-forte px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-tinta-fraca">Até</label>
        <input
          type="date"
          value={value.dateTo}
          onChange={(e) => set("dateTo", e.target.value)}
          className="rounded-md border border-linha-forte px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-tinta-fraca">Rede</label>
        <select
          value={value.networkKey}
          onChange={(e) => set("networkKey", e.target.value)}
          className="rounded-md border border-linha-forte px-2 py-1.5 text-sm"
        >
          <option value="">Todas</option>
          {NETWORK_KEYS.map((k) => (
            <option key={k} value={k}>
              {NETWORK_LABELS[k]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-tinta-fraca">Usuário</label>
        <input
          type="text"
          value={value.actor}
          onChange={(e) => set("actor", e.target.value)}
          placeholder="usuário"
          className="rounded-md border border-linha-forte px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-tinta-fraca">Evento</label>
        <select
          value={value.eventType}
          onChange={(e) => set("eventType", e.target.value)}
          className="rounded-md border border-linha-forte px-2 py-1.5 text-sm"
        >
          <option value="">Todos</option>
          {EVENT_TYPES.map((et) => (
            <option key={et} value={et}>
              {et}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
