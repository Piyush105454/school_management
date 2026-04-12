import { NextResponse } from "next/server";
import { db } from "@/db";
import { classes } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db.select().from(classes).orderBy(asc(classes.grade), asc(classes.name));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
