import { db } from "@/db";
import { users, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password, name, institute } = await request.json();

    if (!email || !password || !name || !institute) {
      return NextResponse.json(
        { error: "Email, password, name, and institute are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new principal user
    const result = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        role: "PRINCIPAL",
      })
      .returning();

    const userId = result[0].id;

    // Create teacher record for the principal
    await db.insert(teachers).values({
      userId: userId,
      employeeId: `PR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      name: name,
      email: email,
      gender: "Not Specified",
      assignedRole: "PRINCIPAL",
      institute: institute,
    });

    return NextResponse.json({
      success: true,
      email: result[0].email,
      message: "Principal account created successfully",
    });
  } catch (error) {
    console.error("Error creating principal:", error);
    return NextResponse.json(
      { error: "Failed to create principal" },
      { status: 500 }
    );
  }
}
