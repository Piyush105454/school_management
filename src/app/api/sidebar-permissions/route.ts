import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { permissions: {} },
        { status: 200 }
      );
    }

    // Return default permissions based on role
    const permissions = {
      [session.user.role]: true,
    };

    return NextResponse.json({ permissions }, { status: 200 });
  } catch (error) {
    console.error("Error in sidebar-permissions:", error);
    return NextResponse.json(
      { permissions: {} },
      { status: 200 }
    );
  }
}
