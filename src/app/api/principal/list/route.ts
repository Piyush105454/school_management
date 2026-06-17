import { db } from "@/db";
import { users, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const principalsList = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        name: teachers.name,
        institute: teachers.institute,
      })
      .from(users)
      .leftJoin(teachers, eq(users.id, teachers.userId))
      .where(eq(users.role, "PRINCIPAL"));

    return NextResponse.json(principalsList);
  } catch (error) {
    console.error("Error fetching principals:", error);
    return NextResponse.json(
      { error: "Failed to fetch principals" },
      { status: 500 }
    );
  }
}
