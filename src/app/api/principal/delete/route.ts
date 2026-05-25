import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { principalId, currentUserEmail } = await request.json();

    if (!principalId) {
      return NextResponse.json(
        { error: "Principal ID is required" },
        { status: 400 }
      );
    }

    // Find the principal
    const principalResult = await db
      .select()
      .from(users)
      .where(eq(users.id, principalId))
      .limit(1);

    if (!principalResult || principalResult.length === 0) {
      return NextResponse.json(
        { error: "Principal account not found" },
        { status: 404 }
      );
    }

    const principal = principalResult[0];

    // Delete principal
    await db.delete(users).where(eq(users.id, principalId));

    const shouldLogout = currentUserEmail === principal.email;

    return NextResponse.json({
      success: true,
      shouldLogout,
      message: "Principal account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting principal account:", error);
    return NextResponse.json(
      { error: "Failed to delete principal account" },
      { status: 500 }
    );
  }
}
