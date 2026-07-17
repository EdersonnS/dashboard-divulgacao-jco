import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materias, materiaNetworks, templates } from "@drizzle/schema";
import { getSessionUser } from "@/lib/auth/session";
import { insertActivityLog } from "@/lib/activity/log";
import { enqueueMateriaFire, removeMateriaJob } from "@/lib/queue/queue";
import { renderTemplate } from "@/lib/templates/render";
import { parseLocalDateTimeToUtc } from "@/lib/time";
import { materiaInputSchema } from "@/lib/validation/schemas";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/constants";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) ? id : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const [materia] = await db
    .select()
    .from(materias)
    .where(eq(materias.id, id))
    .limit(1);

  if (!materia) {
    return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });
  }

  const networks = await db
    .select()
    .from(materiaNetworks)
    .where(eq(materiaNetworks.materiaId, id))
    .orderBy(asc(materiaNetworks.networkKey));

  const { imageData: _imageData, ...materiaWithoutImage } = materia;
  void _imageData;

  return NextResponse.json({ ...materiaWithoutImage, networks });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const session = await getSessionUser();
  const actor = session?.username ?? "desconhecido";

  const [existing] = await db
    .select()
    .from(materias)
    .where(eq(materias.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });
  }

  if (existing.cancelledAt || existing.webhookStatus !== "pending") {
    return NextResponse.json(
      { error: "Esta matéria não pode mais ser editada." },
      { status: 409 },
    );
  }

  const formData = await request.formData();
  const parsed = materiaInputSchema.safeParse({
    titulo: formData.get("titulo"),
    subtitulo: formData.get("subtitulo"),
    link: formData.get("link"),
    scheduledAt: formData.get("scheduledAt"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const imageFile = formData.get("imagem");
  let imageUpdate: { imageData: Buffer; imageMimeType: string; imageSizeBytes: number } | null = null;
  if (imageFile instanceof File && imageFile.size > 0) {
    if (
      !ALLOWED_IMAGE_MIME_TYPES.includes(
        imageFile.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
      )
    ) {
      return NextResponse.json(
        { error: "Formato de imagem não suportado (use JPEG, PNG ou WebP)." },
        { status: 400 },
      );
    }
    if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Imagem excede o tamanho máximo de 5MB." },
        { status: 400 },
      );
    }
    imageUpdate = {
      imageData: Buffer.from(await imageFile.arrayBuffer()),
      imageMimeType: imageFile.type,
      imageSizeBytes: imageFile.size,
    };
  }

  const { titulo, subtitulo, link, scheduledAt } = parsed.data;
  const scheduledAtUtc = parseLocalDateTimeToUtc(scheduledAt);
  const templateRows = await db.select().from(templates);

  await db.transaction(async (tx) => {
    await tx
      .update(materias)
      .set({
        titulo,
        subtitulo,
        link,
        scheduledAt: scheduledAtUtc,
        updatedAt: new Date(),
        ...(imageUpdate ?? {}),
      })
      .where(eq(materias.id, id));

    for (const t of templateRows) {
      await tx
        .update(materiaNetworks)
        .set({
          renderedText: renderTemplate(t.templateText, {
            titulo,
            subtitulo,
            link,
          }),
          copied: false,
          copiedAt: null,
          confirmed: false,
          confirmedAt: null,
          confirmedBy: null,
        })
        .where(
          and(
            eq(materiaNetworks.materiaId, id),
            eq(materiaNetworks.networkKey, t.networkKey),
          ),
        );
    }

    await insertActivityLog(tx, {
      eventType: "materia_edited",
      actor,
      materiaId: id,
    });
  });

  await removeMateriaJob(id);
  await enqueueMateriaFire(id, scheduledAtUtc);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  const session = await getSessionUser();
  const actor = session?.username ?? "desconhecido";

  const [updated] = await db
    .update(materias)
    .set({ cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(materias.id, id))
    .returning({ id: materias.id });

  if (!updated) {
    return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });
  }

  await removeMateriaJob(id);

  await insertActivityLog(db, {
    eventType: "materia_cancelled",
    actor,
    materiaId: id,
  });

  return NextResponse.json({ ok: true });
}
