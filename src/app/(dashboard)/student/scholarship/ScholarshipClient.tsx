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
  const pendingToPay = maxTotal - (record?.totalAmount ?? 0);

  const [paying, setPaying] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

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

      setPaymentDetails(data);

      if (!data.isSandbox) {
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
          alert("Failed to load Razorpay SDK. Try paying with the fallback QR Code option.");
          setShowQrModal(true);
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
                  isSandbox: false,
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
      } else {
        // Sandbox fallback mode - show stunning UPI QR Code Overlay
        setShowQrModal(true);
      }
    } catch (error: any) {
      alert(error.message || "Failed to start payment process");
    } finally {
      setPaying(false);
    }
  };

  const handleVerifySandboxPayment = async () => {
    if (!record) return;
    try {
      setVerifyLoading(true);
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: record.id,
          razorpay_payment_id: "pay_sandbox_" + Math.random().toString(36).substring(2, 10),
          razorpay_order_id: paymentDetails?.orderId,
          razorpay_signature: "sig_sandbox_" + Math.random().toString(36).substring(2, 15),
          isSandbox: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      setShowQrModal(false);
      alert("🎉 Sandbox UPI payment verified successfully!");
      loadData(); // Refresh UI
    } catch (err: any) {
      alert(err.message || "Failed to verify sandbox payment");
    } finally {
      setVerifyLoading(false);
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

      {/* Sandbox UPI QR Scan Modal Overlay */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 animate-in zoom-in-95 duration-200 text-center flex flex-col items-center gap-4">
            <div className="flex justify-between items-center w-full pb-2 border-b">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Secure UPI QR Payment</h2>
              <button 
                onClick={() => {
                  setShowQrModal(false);
                }} 
                className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">DPS Dhanpuri Hub Platform</p>
            
            {/* Interactive Functional QR Code Chart */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `upi://pay?pa=dpsdhanpuri@razorpay&pn=DPS%20Dhanpuri&am=${pendingToPay}&cu=INR&tn=Scholarship%20Balance%20Payment`
                )}`} 
                alt="UPI Payment QR Code"
                className="h-44 w-44 object-contain rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount to Pay</p>
              <p className="text-2xl font-black text-blue-600">₹{pendingToPay}</p>
              <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase truncate max-w-[240px]">
                ORDER: {paymentDetails?.orderId || "N/A"}
              </p>
            </div>

            <div className="flex items-center gap-2 text-slate-500 py-1">
              <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Awaiting secure verification...</span>
            </div>

            <div className="flex flex-col gap-2 w-full pt-2">
              <button
                onClick={handleVerifySandboxPayment}
                disabled={verifyLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                {verifyLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying Signature...
                  </>
                ) : (
                  "Simulate Payment Success"
                )}
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-500 py-3 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
              >
                Cancel Payment
              </button>
            </div>
          </div>
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
