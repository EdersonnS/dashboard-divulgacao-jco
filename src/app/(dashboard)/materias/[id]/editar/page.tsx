import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { materias } from "@drizzle/schema";
import { MateriaForm } from "@/components/materias/MateriaForm";
import { formatDateInputValue, formatTimeInputValue } from "@/lib/time";

export default async function EditarMateriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const [materia] = await db
    .select()
    .from(materias)
    .where(eq(materias.id, id))
    .limit(1);

  if (!materia) notFound();

  if (materia.cancelledAt || materia.webhookStatus !== "pending") {
    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-2 text-lg font-semibold text-tinta">
          Esta matéria não pode mais ser editada
        </h2>
        <p className="text-sm text-tinta-fraca">
          O webhook já foi disparado (ou a matéria foi cancelada), então a edição
          não está mais disponível.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-4 text-xl font-semibold text-tinta">Editar matéria</h2>
      <MateriaForm
        mode="edit"
        materiaId={materia.id}
        initialValues={{
          titulo: materia.titulo,
          subtitulo: materia.subtitulo,
          link: materia.link,
          dateValue: formatDateInputValue(materia.scheduledAt),
          timeValue: formatTimeInputValue(materia.scheduledAt),
        }}
      />
    </div>
  );
}
