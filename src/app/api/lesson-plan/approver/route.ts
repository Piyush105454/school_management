import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { classes, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");

    if (!className) {
      return NextResponse.json(
        { error: "className is required" },
        { status: 400 }
      );
    }

    // Find the class
    const classRecord = await db.query.classes.findFirst({
      where: eq(classes.name, className),
    });

    if (!classRecord) {
      return NextResponse.json(
        { approverName: "NA" },
        { status: 200 }
      );
    }

    // Find the principal for this class's institute
    const principal = await db.query.teachers.findFirst({
      where: eq(teachers.institute, classRecord.institute || ""),
    });

    // Filter for PRINCIPAL role if multiple teachers
    let approver = null;
    if (principal) {
      approver = principal;
    } else {
      const allTeachers = await db.query.teachers.findMany();
      approver = allTeachers.find((t) => t.assignedRole === "PRINCIPAL" && t.institute === classRecord.institute);
    }

    return NextResponse.json(
      {
        approverName: approver?.name || "NA",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching approver:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch approver" },
      { status: 500 }
    );
  }
}
