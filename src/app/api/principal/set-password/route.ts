import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { principalId, password } = await request.json();

    if (!principalId || !password) {
      return NextResponse.json(
        { error: "Principal ID and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Get the principal user
    const principal = await db
      .select()
      .from(users)
      .where(eq(users.id, principalId))
      .limit(1);

    if (!principal || principal.length === 0) {
      return NextResponse.json(
        { error: "Principal not found" },
        { status: 404 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password in database
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, principalId));

    return NextResponse.json({
      success: true,
      email: principal[0].email,
      message: "Password set successfully",
    });
  } catch (error) {
    console.error("Error setting password for principal:", error);
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    );
  }
}
