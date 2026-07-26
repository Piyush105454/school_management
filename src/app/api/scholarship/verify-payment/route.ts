import { db } from "@/db";
import { scholarshipRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature, recordId } = body;

    if (!orderId || !paymentId || !signature || !recordId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured" },
        { status: 500 }
      );
    }

    // Verify Razorpay signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (generated_signature !== signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Update scholarship record status to PAID
    await db
      .update(scholarshipRecords)
      .set({
        status: "PAID",
        paidOnline: 1,
        updatedAt: new Date(),
      })
      .where(eq(scholarshipRecords.id, recordId));

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      paymentId,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
