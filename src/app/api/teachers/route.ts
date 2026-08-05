import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    const list = await db.query.teachers.findMany({
      columns: { id: true, name: true },
      orderBy: (t, { asc }) => [asc(t.name)]
    });
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
