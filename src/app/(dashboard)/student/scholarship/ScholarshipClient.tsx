"use client";

import { useState, useEffect } from "react";
import { getStudentKpiData } from "@/features/scholarship/actions/kpiActions";
import { X } from "lucide-react";

export default function ScholarshipClient({ admissionId }: { admissionId: string }) {
  const [month, setMonth] = useState("April");
  const [year, setYear] = useState("2026");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [month, year]);

  const loadData = async () => {
    setLoading(true);
    const res = await getStudentKpiData(admissionId, month, year);
    if (res.success) {
      setData(res.data);
    }
    setLoading(false);
  };

  const record = data?.record;
  const criteria = data?.criteria;
  const maxAttendance = criteria?.attendanceAmount ?? 750;
  const maxHomework = criteria?.homeworkAmount ?? 750;
  const maxGuardian = criteria?.guardianAmount ?? 750;
  const maxPtm = criteria?.ptmAmount ?? 750;
  const maxTotal = maxAttendance + maxHomework + maxGuardian + maxPtm;
  const originalPending = maxTotal - (record?.totalAmount ?? 0) + (record?.adjustmentAmount ?? 0);
  const isPaid = record?.status === "PAID";
  const pendingToPay = isPaid ? 0 : originalPending;

  const [paying, setPaying] = useState(false);

  const handlePaymentInit = async () => {
    if (!record) return;
    try {
      setPaying(true);
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: record.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment");

      // Load Razorpay Script and open checkout
      const loadScript = () => {
        return new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const loaded = await loadScript();
      if (!loaded) {
        alert("Failed to load Razorpay SDK. Please check your internet connection.");
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "DPS Dhanpuri",
        description: `Scholarship Balance Payment - ${month} ${year}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            setPaying(true);
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recordId: record.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Signature verification failed");

            alert("🎉 Payment verified and balance updated successfully!");
            loadData(); // Refresh UI
          } catch (err: any) {
            alert(err.message || "Failed to verify payment");
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          email: "student@dps.com",
          contact: "9999999999",
        },
        theme: {
          color: "#2563EB",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      alert(error.message || "Failed to start payment process");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto relative">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900">My Scholarship</h1>
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="border p-2 rounded-md text-sm bg-white border-slate-300">
            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="border p-2 rounded-md text-sm bg-white border-slate-300">
            {["2025", "2026", "2027"].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold text-slate-500">Loading KPI Data...</p>
        </div>
      ) : record ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 relative">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-800">{month} {year}</h2>
          </div>

          <div className="space-y-3">
            <KpiRow 
              label="Attendance" 
              value={`${data.attendance?.percentage?.toFixed(1) || 0}%`} 
              amount={record.attendanceAmount} 
              success={record.attendanceAmount > 0} 
            />
            <KpiRow 
              label="Homework" 
              value={`${(data.homework?.percentage ?? data.calculatedHomework?.percentage ?? 0).toFixed(1)}%`} 
              amount={record.homeworkAmount} 
              success={record.homeworkAmount > 0} 
            />
            <KpiRow 
              label="Guardian Rating" 
              value={`${data.guardian?.rating || 0}/5`} 
              amount={record.guardianAmount} 
              success={record.guardianAmount > 0} 
            />
            <KpiRow 
              label="PTM Attended" 
              value={data.ptm?.attended ? "Yes" : "No"} 
              amount={record.ptmAmount} 
              success={record.ptmAmount > 0} 
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-slate-500">
              <span>Total School Fee</span>
              <span>₹{maxTotal}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
              <span>Scholarship Earned</span>
              <span>- ₹{record.totalAmount}</span>
            </div>
            {record.adjustmentAmount && record.adjustmentAmount !== 0 && (
              <div className={`flex justify-between items-center text-sm font-bold ${record.adjustmentAmount < 0 ? "text-blue-600" : "text-amber-600"}`}>
                <span>Adjustment ({record.adjustmentAmount < 0 ? "Discount" : "Charge"})</span>
                <span>{record.adjustmentAmount < 0 ? "-" : "+"} ₹{Math.abs(record.adjustmentAmount)}</span>
              </div>
            )}
            {isPaid && originalPending > 0 && (
              <div className="flex justify-between items-center text-sm font-bold text-blue-600">
                <span>Amount Paid Online</span>
                <span>- ₹{originalPending}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-black text-lg text-rose-600 border-t border-dashed border-slate-100 pt-2">
              <span>Pending Money to Pay</span>
              <span>₹{pendingToPay}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm border-t pt-3 border-slate-100">
            <span className="text-slate-500">Scholarship Status</span>
            <span className={`font-black uppercase tracking-wider text-xs px-3 py-1 rounded-full ${record.status === "PAID" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
              {record.status}
            </span>
          </div>

          {record.status !== "PAID" && pendingToPay > 0 && (
            <button
              onClick={handlePaymentInit}
              disabled={paying}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 text-sm mt-3"
            >
              {paying ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Initializing Secure Payment...
                </>
              ) : (
                `💳 Pay Pending Balance (₹${pendingToPay})`
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500 animate-in fade-in duration-300">
          No records found for {month} {year}.
        </div>
      )}
    </div>
  );
}

function KpiRow({ label, value, amount, success }: { label: string, value: any, amount: number, success: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0 border-slate-100">
      <div className="flex items-center gap-2">
        <span>{success ? "✅" : "❌"}</span>
        <span className="text-slate-700 font-medium text-sm">{label}</span>
        <span className="text-slate-400 text-xs">({value})</span>
      </div>
      <span className={`font-bold text-sm ${success ? "text-green-600" : "text-slate-400"}`}>
        ₹{amount}
      </span>
    </div>
  );
}
