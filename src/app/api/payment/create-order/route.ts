import { db } from "@/db";
import { scholarshipRecords, scholarshipCriteriaSettings } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { recordId } = await request.json();
    if (!recordId) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    const record = await db.query.scholarshipRecords.findFirst({
      where: eq(scholarshipRecords.id, recordId)
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Calculate maximum criteria amount
    let criteria = await db.query.scholarshipCriteriaSettings.findFirst({
      where: and(
        eq(scholarshipCriteriaSettings.academicYear, "2025-26"),
        eq(scholarshipCriteriaSettings.admissionId, record.admissionId)
      )
    });

    if (!criteria) {
      criteria = await db.query.scholarshipCriteriaSettings.findFirst({
        where: and(
          eq(scholarshipCriteriaSettings.academicYear, "2025-26"),
          isNull(scholarshipCriteriaSettings.admissionId)
        )
      });
    }

    const maxAttendance = criteria?.attendanceAmount ?? 750;
    const maxHomework = criteria?.homeworkAmount ?? 750;
    const maxGuardian = criteria?.guardianAmount ?? 750;
    const maxPtm = criteria?.ptmAmount ?? 750;
    const maxTotal = maxAttendance + maxHomework + maxGuardian + maxPtm;
    const pendingToPay = maxTotal - record.totalAmount;

    if (pendingToPay <= 0) {
      return NextResponse.json({ error: "No pending balance for this record" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      // Real Razorpay order creation
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth}`
        },
        body: JSON.stringify({
          amount: pendingToPay * 100, // in paise
          currency: "INR",
          receipt: `rcpt_${record.id.substring(0, 10)}`
        })
      });

      const orderData = await response.json();
      if (!response.ok) {
        throw new Error(orderData.error?.description || "Razorpay order creation failed");
      }

      return NextResponse.json({
        success: true,
        isSandbox: false,
        keyId,
        orderId: orderData.id,
        amount: pendingToPay * 100,
        currency: "INR"
      });
    } else {
      // Sandbox fallback mode (No keys in env)
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 15)}`;
      return NextResponse.json({
        success: true,
        isSandbox: true,
        keyId: "rzp_test_sandbox",
        orderId: mockOrderId,
        amount: pendingToPay,
        currency: "INR"
      });
    }
  } catch (error: any) {
    console.error("Payment order creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to initiate payment" }, { status: 500 });
  }
}
