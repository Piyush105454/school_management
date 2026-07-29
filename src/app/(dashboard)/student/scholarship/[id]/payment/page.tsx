"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaymentRecord {
  id: string;
  admissionId: string;
  name: string;
  className: string;
  rollNo: string;
  scholarNo: string;
  month: string;
  year: string;
  totalSchoolFee: number;
  scholarshipEarned: number;
  pendingDue: number;
  waiverGiven: number;
  additionalCharge: number;
  adjustmentNote?: string;
  finalDue: number;
  paidOnline: number;
  status: string;
  attendancePercentage: number | null;
  totalDays?: number;
  presentDays?: number;
  absentDays?: number;
  mlDays?: number;
  halfDays?: number;
  leaveDays?: number;
  homeworkPercentage: number | null;
  guardianRating: number | null;
  ptmAttended: boolean;
  attendanceAmount: number;
  homeworkAmount: number;
  guardianAmount: number;
  ptmAmount: number;
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id: recordId } = use(params);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const [record, setRecord] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/scholarship/record/${recordId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch record");
        }
        const data: PaymentRecord = await res.json();
        setRecord(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [recordId]);

  const handlePayment = async () => {
    if (!record) return;

    try {
      setProcessing(true);
      setError(null);

      // Create Razorpay order via API
      const response = await fetch(`/api/scholarship/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: record.id,
          amount: record.finalDue,
          month: record.month,
          year: record.year,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate payment");
      }

      const data = await response.json();
      const { orderId, key } = data;

      // Load Razorpay script if not already loaded
      if (!(window as any).Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        
        script.onload = () => openRazorpay(orderId, key);
        script.onerror = () => {
          setError("Failed to load payment gateway");
          setProcessing(false);
        };
      } else {
        openRazorpay(orderId, key);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setProcessing(false);
    }
  };

  const openRazorpay = (orderId: string, key: string) => {
    const options = {
      key,
      order_id: orderId,
      amount: record?.finalDue,
      currency: "INR",
      name: "School Scholarship Payment",
      description: `Scholarship payment for ${month} ${year}`,
      prefill: {
        email: "student@example.com",
        contact: "9999999999",
      },
      handler: async (response: any) => {
        try {
          // Verify payment on backend
          const verifyResponse = await fetch(`/api/scholarship/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              recordId: record?.id,
            }),
          });

          if (verifyResponse.ok) {
            router.push("/student/scholarship?success=true");
          } else {
            setError("Payment verification failed");
          }
        } catch (err) {
          setError("Payment verification error");
        } finally {
          setProcessing(false);
        }
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 font-semibold mb-4">{error || "Record not found"}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const parseAdjustmentNotes = (note?: string | null) => {
    if (!note) return { discountNote: "", chargeNote: "" };
    let discountNote = "";
    let chargeNote = "";

    if (note.includes("|")) {
      const parts = note.split("|");
      parts.forEach(p => {
        if (p.includes("Discount Note:")) {
          discountNote = p.replace("Discount Note:", "").trim();
        } else if (p.includes("Charge Note:")) {
          chargeNote = p.replace("Charge Note:", "").trim();
        }
      });
    } else if (note.startsWith("Discount Note:")) {
      discountNote = note.replace("Discount Note:", "").trim();
    } else if (note.startsWith("Charge Note:")) {
      chargeNote = note.replace("Charge Note:", "").trim();
    } else {
      discountNote = note;
    }
    return { discountNote, chargeNote };
  };

  const { discountNote, chargeNote } = parseAdjustmentNotes(record.adjustmentNote);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 sticky top-0">
          <div>
            <h2 className="text-lg font-black text-white">Pay Pending Balance</h2>
            <p className="text-xs text-slate-400 font-medium">{month} {year}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* Payment Details */}
        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Scholarship Details Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Scholarship Criteria Results</h3>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-slate-600 font-medium">Attendance</span>
                  <div className="text-xs text-slate-500">
                    <span>{record.attendancePercentage !== null && record.attendancePercentage !== undefined ? `${record.attendancePercentage.toFixed(1)}%` : "N/A"}</span>
                    {(record.totalDays || 0) > 0 && (
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                        Total: {record.totalDays}d (P: {record.presentDays || 0}, A: {record.absentDays || 0}, ML: {record.mlDays || 0}, HD: {record.halfDays || 0}, L: {record.leaveDays || 0})
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-bold text-emerald-600">₹{record.attendanceAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-slate-600">Homework</span>
                  <span className="text-xs text-slate-500 block">
                    {record.homeworkPercentage !== null && record.homeworkPercentage !== undefined ? `${record.homeworkPercentage.toFixed(1)}%` : "N/A"}
                  </span>
                </div>
                <span className="font-bold text-emerald-600">₹{record.homeworkAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-slate-600">Guardian Rating</span>
                  <span className="text-xs text-slate-500 block">
                    {record.guardianRating !== null && record.guardianRating !== undefined ? `${record.guardianRating}/5` : "N/A"}
                  </span>
                </div>
                <span className="font-bold text-emerald-600">₹{record.guardianAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-slate-600">PTM Attended</span>
                  <span className="text-xs text-slate-500 block">
                    {record.ptmAttended ? "Yes ✓" : "No"}
                  </span>
                </div>
                <span className="font-bold text-emerald-600">₹{record.ptmAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Fee Breakdown Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Fee Summary</h3>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-600">School Fee</span>
                <span className="font-bold text-slate-800">₹{record.totalSchoolFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-600">Scholarship Earned</span>
                <span className="font-bold text-emerald-600">- ₹{record.scholarshipEarned.toLocaleString()}</span>
              </div>
              {record.waiverGiven > 0 && (
                <div className="space-y-0.5">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">Waiver/Discount</span>
                    <span className="font-bold text-blue-600">- ₹{record.waiverGiven.toLocaleString()}</span>
                  </div>
                  {discountNote && (
                    <p className="text-[11px] font-semibold text-blue-500/90 pl-1 italic">
                      Note: {discountNote}
                    </p>
                  )}
                </div>
              )}
              {record.additionalCharge > 0 && (
                <div className="space-y-0.5">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">Additional Charge</span>
                    <span className="font-bold text-amber-600">+ ₹{record.additionalCharge.toLocaleString()}</span>
                  </div>
                  {chargeNote && (
                    <p className="text-[11px] font-semibold text-amber-600/90 pl-1 italic">
                      Note: {chargeNote}
                    </p>
                  )}
                </div>
              )}
              <div className="border-t-2 border-slate-200 pt-3 flex justify-between font-black text-lg">
                <span className="text-slate-900">Balance Due</span>
                <span className="text-rose-600">₹{record.finalDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
          >
            {processing ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              `💳 Pay ₹${record.finalDue.toLocaleString()} Now`
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="px-6 py-3 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
          <button
            onClick={() => router.back()}
            className="flex-1 px-5 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
