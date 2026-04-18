import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { adminId, currentUserEmail } = await request.json();

    if (!adminId) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Get the admin user
    const admin = await db
      .select()
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!admin || admin.length === 0) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    // Delete the admin (cascade delete will handle related data)
    await db.delete(users).where(eq(users.id, adminId));

    // Check if the deleted admin is the current logged-in user
    const isCurrentUser = currentUserEmail === admin[0].email;

    return NextResponse.json({
      success: true,
      email: admin[0].email,
      message: "Admin deleted successfully",
      shouldLogout: isCurrentUser,
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { error: "Failed to delete admin" },
      { status: 500 }
    );
  }
}
