"use client";

import { SWRConfig } from "swr";

/**
 * Fetcher global do SWR. Tê-lo no provider (e não só inline em cada useSWR)
 * permite revalidar uma chave de qualquer lugar — ex.: após criar uma matéria,
 * `mutate("/api/materias")` recarrega a lista mesmo sem a home estar montada.
 */
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("erro");
    return res.json();
  });

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={{ fetcher }}>{children}</SWRConfig>;
}
