import { db } from "@/db";
import { scholarshipRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { recordId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

    if (!recordId) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment confirmation parameters from Razorpay" }, { status: 400 });
    }

    // Real signature verification
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Razorpay Key Secret is missing on the server" }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature (verification failed)" }, { status: 400 });
    }

    // Update database status to PAID
    await db
      .update(scholarshipRecords)
      .set({
        status: "PAID",
        updatedAt: new Date()
      })
      .where(eq(scholarshipRecords.id, recordId));

    return NextResponse.json({
      success: true,
      message: "Payment verified securely and status updated to PAID"
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: error.message || "Payment verification failed" }, { status: 500 });
  }
}
