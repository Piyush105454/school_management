import { db } from "@/db";
import { scholarshipRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId, amount, month, year } = body;

    if (!recordId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured" },
        { status: 500 }
      );
    }

    // Verify the record exists
    const record = await db
      .select()
      .from(scholarshipRecords)
      .where(eq(scholarshipRecords.id, recordId))
      .limit(1);

    if (!record || record.length === 0) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    // Use Razorpay REST API directly instead of SDK
    const receipt = `sch_${recordId.slice(0, 24)}_${Date.now().toString().slice(-7)}`;
    
    const basicAuth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
    
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to paise
        currency: "INR",
        receipt: receipt.slice(0, 40),
        notes: {
          recordId,
          month,
          year,
        },
      }),
    });

    const orderData = await response.json();
    
    if (!response.ok) {
      throw new Error(orderData.error?.description || "Razorpay order creation failed");
    }

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount,
      month,
      year,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
