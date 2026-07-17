"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, Activity } from "lucide-react";
import { computeMateriaStatus, pickFeaturedMateria } from "@/lib/status";
import { LoadingBlock } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  FeaturedMateria,
  FeaturedEmpty,
} from "@/components/materias/FeaturedMateria";
import { MateriaList } from "@/components/materias/MateriaList";
import type { MateriaListItem } from "@/components/materias/types";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("erro");
    return res.json();
  });

export default function HomePage() {
  const { data, isLoading, error, mutate } = useSWR<MateriaListItem[]>(
    "/api/materias",
    fetcher,
    // refreshWhenHidden: o painel continua atualizando mesmo com a aba aberta
    // em segundo plano, para a virada "próxima → divulgar agora" chegar na hora.
    { refreshInterval: 7000, refreshWhenHidden: true },
  );

  // relógio de 1s: quando o horário de uma matéria chega, o destaque troca de
  // "próxima" para "divulgar agora" na hora, sem esperar o próximo poll do SWR.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const featured = useMemo(
    () => (data ? pickFeaturedMateria(data, new Date(nowTick)) : null),
    [data, nowTick],
  );

  // depende só do id do destaque (primitivo), não do objeto recriado a cada tique
  const featuredId = featured?.materia.id;
  // A linha do tempo é a AGENDA: só matérias ainda por divulgar (agendadas ou
  // atrasadas). Assim que uma é confirmada (divulgada) — ou cancelada — ela sai
  // daqui e passa a aparecer apenas no Histórico.
  const others = useMemo(() => {
    if (!data) return [];
    return data.filter((m) => {
      if (m.id === featuredId) return false;
      const status = computeMateriaStatus(m, m.networks);
      return status === "agendada" || status === "atrasada";
    });
  }, [data, featuredId]);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-tinta-media mt-0.5 text-sm">
            Visão geral do fluxo de divulgação
          </p>
        </div>
        <Link href="/materias/nova">
          <Button>
            <Plus size={16} strokeWidth={2.5} aria-hidden />
            Nova matéria
          </Button>
        </Link>
      </header>

      {isLoading && <LoadingBlock label="Carregando o painel..." />}

      {error && !isLoading && (
        <EmptyState
          tone="error"
          title="Não foi possível carregar o painel"
          description="A conexão com o servidor falhou. O painel tenta de novo sozinho a cada poucos segundos."
          action={<Button onClick={() => mutate()}>Tentar de novo</Button>}
        />
      )}

      {data && !error && (
        <>
          {featured ? (
            <FeaturedMateria
              materia={featured.materia}
              kind={featured.kind}
              onChanged={() => mutate()}
            />
          ) : (
            <FeaturedEmpty />
          )}

          {others.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
                <Activity size={16} strokeWidth={2.25} className="text-marca" aria-hidden />
                Linha do tempo
              </h2>
              <MateriaList materias={others} onChanged={() => mutate()} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
