"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { Button } from "@/components/ui/Button";
import { combineDateTime, nowDateInputValue, nowTimeInputValue } from "@/lib/time";
import { LivePreviewPanel } from "./LivePreviewPanel";

export interface MateriaFormInitialValues {
  titulo: string;
  subtitulo: string;
  link: string;
  dateValue: string;
  timeValue: string;
}

const inputClass =
  "w-full rounded-lg border border-linha-forte px-3 py-2.5 text-sm text-tinta focus:border-marca focus:outline-none focus-visible:ring-2 focus-visible:ring-marca";

export function MateriaForm({
  mode,
  materiaId,
  initialValues,
}: {
  mode: "create" | "edit";
  materiaId?: number;
  initialValues?: MateriaFormInitialValues;
}) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [titulo, setTitulo] = useState(initialValues?.titulo ?? "");
  const [subtitulo, setSubtitulo] = useState(initialValues?.subtitulo ?? "");
  const [link, setLink] = useState(initialValues?.link ?? "");
  // pré-preenche com a data/hora atuais (SP) ao criar
  const [dateValue, setDateValue] = useState(
    initialValues?.dateValue ?? nowDateInputValue(),
  );
  const [timeValue, setTimeValue] = useState(
    initialValues?.timeValue ?? nowTimeInputValue(),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "create" && !imageFile) {
      setError("Selecione uma imagem de capa.");
      return;
    }
    if (!dateValue || !timeValue) {
      setError("Informe a data e a hora do agendamento.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("titulo", titulo);
      formData.set("subtitulo", subtitulo);
      formData.set("link", link);
      formData.set("scheduledAt", combineDateTime(dateValue, timeValue));
      if (imageFile) formData.set("imagem", imageFile);

      const url = mode === "create" ? "/api/materias" : `/api/materias/${materiaId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, { method, body: formData });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }

      // revalida o cache do SWR ANTES de navegar, para a matéria já aparecer
      // na lista/detalhe sem precisar recarregar a página
      await mutate("/api/materias");
      if (mode === "edit" && materiaId) {
        await mutate(`/api/materias/${materiaId}`);
      }

      router.push(mode === "create" ? "/" : `/materias/${materiaId}`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-tinta">
            Título
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-tinta">
            Subtítulo
          </label>
          <input
            type="text"
            value={subtitulo}
            onChange={(e) => setSubtitulo(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-tinta">
            Link
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            required
            placeholder="https://..."
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-tinta">
            Imagem de capa{" "}
            {mode === "edit" && (
              <span className="font-normal text-tinta-fraca">
                (deixe em branco para manter a atual)
              </span>
            )}
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm file:mr-3 file:min-h-[40px] file:rounded-lg file:border-0 file:bg-canvas file:px-3 file:py-2 file:text-sm file:font-medium file:text-tinta"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-tinta">
              Data (Brasília)
            </label>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-tinta">
              Hora (Brasília)
            </label>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-erro-suave px-3 py-2 text-sm text-erro-ink">
            {error}
          </p>
        )}

        <Button type="submit" disabled={saving}>
          {saving
            ? "Salvando..."
            : mode === "create"
              ? "Agendar matéria"
              : "Salvar alterações"}
        </Button>
      </form>

      <LivePreviewPanel variables={{ titulo, subtitulo, link }} />
    </div>
  );
}
