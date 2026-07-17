"use client";

import useSWR from "swr";
import { renderTemplate, type TemplateVariables } from "@/lib/templates/render";

interface Template {
  networkKey: string;
  label: string;
  templateText: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LivePreviewPanel({ variables }: { variables: TemplateVariables }) {
  const { data: templates } = useSWR<Template[]>("/api/templates", fetcher);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-tinta">
        Preview dos textos por rede
      </h3>
      {!templates && <p className="text-sm text-tinta-fraca">Carregando templates...</p>}
      {templates?.map((t) => (
        <div key={t.networkKey} className="rounded-md border border-linha bg-canvas p-3">
          <p className="mb-1 text-xs font-medium text-tinta-fraca">{t.label}</p>
          <p className="whitespace-pre-wrap text-sm text-tinta">
            {renderTemplate(t.templateText, variables) || (
              <span className="text-tinta-fraca">Preencha os campos ao lado...</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
