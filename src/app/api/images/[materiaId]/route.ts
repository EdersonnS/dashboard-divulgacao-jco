import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materias } from "@drizzle/schema";

/** Vira o título num nome de arquivo seguro: "Ministro anuncia..." → "ministro-anuncia". */
function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ materiaId: string }> },
) {
  const { materiaId } = await params;
  const id = Number(materiaId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const [materia] = await db
    .select({
      imageData: materias.imageData,
      imageMimeType: materias.imageMimeType,
      updatedAt: materias.updatedAt,
      titulo: materias.titulo,
    })
    .from(materias)
    .where(eq(materias.id, id))
    .limit(1);

  if (!materia || !materia.imageData || !materia.imageMimeType) {
    return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": materia.imageMimeType,
    "Cache-Control": "public, max-age=300, must-revalidate",
    ETag: `"${materia.updatedAt.getTime()}"`,
  };

  // ?download=1 força o download com um nome de arquivo legível
  if (new URL(request.url).searchParams.has("download")) {
    const ext =
      materia.imageMimeType === "image/png"
        ? "png"
        : materia.imageMimeType === "image/webp"
          ? "webp"
          : "jpg";
    const nome = slugify(materia.titulo) || `materia-${id}`;
    headers["Content-Disposition"] = `attachment; filename="${nome}.${ext}"`;
  }

  return new NextResponse(new Uint8Array(materia.imageData), {
    status: 200,
    headers,
  });
}
