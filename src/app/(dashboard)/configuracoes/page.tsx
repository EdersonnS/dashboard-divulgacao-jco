"use client";

import { useState } from "react";
import useSWR from "swr";
import { renderTemplate } from "@/lib/templates/render";

interface Template {
  id: number;
  networkKey: string;
  label: string;
  templateText: string;
  updatedAt: string;
  updatedBy: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const SAMPLE_VARS = {
  titulo: "Título de exemplo da matéria",
  subtitulo: "Subtítulo de exemplo com mais detalhes",
  link: "https://exemplo.com/materia",
};

function TemplateEditor({ template }: { template: Template }) {
  const [text, setText] = useState(template.templateText);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSavedMsg(null);
    try {
      const res = await fetch(`/api/templates/${template.networkKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateText: text }),
      });
      if (res.ok) {
        setSavedMsg("Salvo!");
        setTimeout(() => setSavedMsg(null), 2000);
      } else {
        setSavedMsg("Erro ao salvar.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-linha bg-painel p-4">
      <h3 className="mb-2 text-sm font-semibold text-tinta">
        {template.label}
      </h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full rounded-md border border-linha-forte px-3 py-2  text-sm focus:border-marca focus:outline-none"
      />
      <p className="mt-1 text-xs text-tinta-fraca">
        Variáveis disponíveis: {"{{titulo}}"}, {"{{subtitulo}}"}, {"{{link}}"}
      </p>

      <div className="mt-3 rounded-md bg-canvas p-3">
        <p className="mb-1 text-xs font-medium text-tinta-fraca">Preview</p>
        <p className="whitespace-pre-wrap text-sm text-tinta">
          {renderTemplate(text, SAMPLE_VARS)}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-marca px-4 py-1.5 text-sm font-medium text-white hover:bg-marca-hover disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {savedMsg && <span className="text-sm text-tinta-fraca">{savedMsg}</span>}
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { data: templates, isLoading } = useSWR<Template[]>(
    "/api/templates",
    fetcher,
  );

  return (
    <div className="max-w-2xl">
      <h2 className="mb-1 text-lg font-semibold text-tinta">
        Configurações — Templates das redes
      </h2>
      <p className="mb-6 text-sm text-tinta-fraca">
        Edite o texto-modelo usado para gerar o pack copia-cola de cada rede.
      </p>

      {isLoading && <p className="text-sm text-tinta-fraca">Carregando...</p>}

      <div className="flex flex-col gap-4">
        {templates?.map((t) => (
          <TemplateEditor key={t.networkKey} template={t} />
        ))}
      </div>
    </div>
  );
}
