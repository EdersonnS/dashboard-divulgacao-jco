import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { templates } from "@drizzle/schema";

export async function GET() {
  const rows = await db.select().from(templates).orderBy(templates.networkKey);
  return NextResponse.json(rows);
}
