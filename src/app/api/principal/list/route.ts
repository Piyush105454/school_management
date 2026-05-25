import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const principals = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "PRINCIPAL"));

    return NextResponse.json(principals);
  } catch (error) {
    console.error("Error fetching principals:", error);
    return NextResponse.json(
      { error: "Failed to fetch principals" },
      { status: 500 }
    );
  }
}
