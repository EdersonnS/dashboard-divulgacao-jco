import { MateriaForm } from "@/components/materias/MateriaForm";

export default function NovaMateriaPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-4 text-xl font-semibold text-tinta">Nova matéria</h2>
      <MateriaForm mode="create" />
    </div>
  );
}
