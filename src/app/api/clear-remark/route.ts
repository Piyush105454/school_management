import { NextResponse } from "next/server";
import { db } from "@/db";
import { admissionMeta } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const admissionId = searchParams.get("id");
    const type = searchParams.get("type");

    if (!admissionId || !type) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const updates: any = {};
    if (type === "document") updates.documentRemarks = null;
    if (type === "verification") updates.verificationRemarks = null;
    if (type === "office") updates.officeRemarks = null;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db.update(admissionMeta)
        .set(updates)
        .where(eq(admissionMeta.id, admissionId));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Clear remark error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
