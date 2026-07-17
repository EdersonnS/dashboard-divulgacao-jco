"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { NETWORK_LABELS, type NetworkKey } from "@/lib/constants";
import {
  HistoricoFilters,
  type HistoricoFiltersValue,
} from "@/components/historico/HistoricoFilters";
import { HistoricoTable, type ActivityLogRow } from "@/components/historico/HistoricoTable";
import { LoadingBlock } from "@/components/ui/Spinner";

interface HistoricoResponse {
  rows: ActivityLogRow[];
  stats: { networkKey: NetworkKey; total: number }[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const EMPTY_FILTERS: HistoricoFiltersValue = {
  dateFrom: "",
  dateTo: "",
  networkKey: "",
  actor: "",
  eventType: "",
};

export default function HistoricoPage() {
  const [filters, setFilters] = useState<HistoricoFiltersValue>(EMPTY_FILTERS);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.networkKey) params.set("networkKey", filters.networkKey);
    if (filters.actor) params.set("actor", filters.actor);
    if (filters.eventType) params.set("eventType", filters.eventType);
    return params.toString();
  }, [filters]);

  const { data, isLoading } = useSWR<HistoricoResponse>(
    `/api/historico?${queryString}`,
    fetcher,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="mb-4 text-xl font-semibold text-tinta">Histórico</h2>

      <HistoricoFilters value={filters} onChange={setFilters} />

      {data?.stats && data.stats.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {data.stats.map((s) => (
            <div
              key={s.networkKey}
              className="rounded-lg border border-linha bg-painel px-3 py-2 text-sm"
            >
              <span className="text-tinta-fraca">{NETWORK_LABELS[s.networkKey]}: </span>
              <span className="font-semibold text-tinta">{s.total}</span>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <LoadingBlock label="Carregando histórico..." />
      ) : (
        <HistoricoTable rows={data?.rows ?? []} />
      )}
    </div>
  );
}
