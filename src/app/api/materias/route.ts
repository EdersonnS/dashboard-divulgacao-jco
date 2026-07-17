import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { materias, materiaNetworks, templates } from "@drizzle/schema";
import { getSessionUser } from "@/lib/auth/session";
import { insertActivityLog } from "@/lib/activity/log";
import { enqueueMateriaFire } from "@/lib/queue/queue";
import { renderTemplate } from "@/lib/templates/render";
import { parseLocalDateTimeToUtc } from "@/lib/time";
import { materiaInputSchema } from "@/lib/validation/schemas";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/constants";

export async function GET() {
  const materiasRows = await db
    .select({
      id: materias.id,
      titulo: materias.titulo,
      subtitulo: materias.subtitulo,
      link: materias.link,
      scheduledAt: materias.scheduledAt,
      webhookStatus: materias.webhookStatus,
      webhookLastError: materias.webhookLastError,
      firedAt: materias.firedAt,
      cancelledAt: materias.cancelledAt,
      createdBy: materias.createdBy,
      createdAt: materias.createdAt,
    })
    .from(materias)
    .orderBy(asc(materias.scheduledAt));

  const networksRows = await db
    .select({
      materiaId: materiaNetworks.materiaId,
      networkKey: materiaNetworks.networkKey,
      renderedText: materiaNetworks.renderedText,
      confirmed: materiaNetworks.confirmed,
      copied: materiaNetworks.copied,
    })
    .from(materiaNetworks)
    .orderBy(asc(materiaNetworks.networkKey));

  const networksByMateria = new Map<number, typeof networksRows>();
  for (const row of networksRows) {
    const list = networksByMateria.get(row.materiaId) ?? [];
    list.push(row);
    networksByMateria.set(row.materiaId, list);
  }

  const result = materiasRows.map((m) => ({
    ...m,
    networks: networksByMateria.get(m.id) ?? [],
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  const actor = session?.username ?? "desconhecido";

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
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return NextResponse.json(
      { error: "Imagem de capa é obrigatória." },
      { status: 400 },
    );
  }
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

  const { titulo, subtitulo, link, scheduledAt } = parsed.data;
  const scheduledAtUtc = parseLocalDateTimeToUtc(scheduledAt);
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

  const templateRows = await db.select().from(templates);

  const createdId = await db.transaction(async (tx) => {
    const [materia] = await tx
      .insert(materias)
      .values({
        titulo,
        subtitulo,
        link,
        imageData: imageBuffer,
        imageMimeType: imageFile.type,
        imageSizeBytes: imageFile.size,
        scheduledAt: scheduledAtUtc,
        createdBy: actor,
      })
      .returning({ id: materias.id });

    await tx.insert(materiaNetworks).values(
      templateRows.map((t) => ({
        materiaId: materia.id,
        networkKey: t.networkKey,
        renderedText: renderTemplate(t.templateText, {
          titulo,
          subtitulo,
          link,
        }),
      })),
    );

    await insertActivityLog(tx, {
      eventType: "materia_created",
      actor,
      materiaId: materia.id,
    });

    return materia.id;
  });

  await enqueueMateriaFire(createdId, scheduledAtUtc);

  return NextResponse.json({ id: createdId }, { status: 201 });
}
