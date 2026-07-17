import { NextResponse } from "next/server";
import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { activityLog, materiaNetworks } from "@drizzle/schema";
import { historicoQuerySchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = historicoQuerySchema.safeParse({
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    networkKey: searchParams.get("networkKey") ?? undefined,
    actor: searchParams.get("actor") ?? undefined,
    eventType: searchParams.get("eventType") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros inválidos." }, { status: 400 });
  }

  const { dateFrom, dateTo, networkKey, actor, eventType } = parsed.data;

  const conditions: SQL[] = [];
  if (dateFrom) conditions.push(gte(activityLog.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(activityLog.createdAt, new Date(dateTo)));
  if (networkKey) conditions.push(eq(activityLog.networkKey, networkKey));
  if (actor) conditions.push(eq(activityLog.actor, actor));
  if (eventType) conditions.push(eq(activityLog.eventType, eventType));

  const rows = await db
    .select()
    .from(activityLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(activityLog.createdAt))
    .limit(500);

  const statsRows = await db
    .select({ networkKey: materiaNetworks.networkKey, total: count() })
    .from(materiaNetworks)
    .where(eq(materiaNetworks.confirmed, true))
    .groupBy(materiaNetworks.networkKey);

  return NextResponse.json({ rows, stats: statsRows });
}
