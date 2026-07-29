"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

interface RecordRow {
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
  homeworkPercentage: number | null;
  guardianRating: number | null;
  ptmAttended: boolean;
  attendanceAmount: number;
  homeworkAmount: number;
  guardianAmount: number;
  ptmAmount: number;
}

export default function ScholarshipClient({ 
  admissionId, 
  isScholarshipAwarded 
}: { 
  admissionId: string; 
  isScholarshipAwarded: boolean; 
}) {
  const router = useRouter();
  const [year, setYear] = useState("2026");
  const [monthlyData, setMonthlyData] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalDue, setTotalDue] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [totalWaiver, setTotalWaiver] = useState<number>(0);
  const [totalCharge, setTotalCharge] = useState<number>(0);
  const [totalPayable, setTotalPayable] = useState<number>(0);
  const [selectedRecord, setSelectedRecord] = useState<RecordRow | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadData();
  }, [year, admissionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scholarship/records?admissionId=${admissionId}&year=${year}`);
      if (res.ok) {
        const records: RecordRow[] = await res.json();
        
        // Create full 12-month list (June to April) with placeholders for missing months
        const monthOrder = ["June", "July", "August", "September", "October", "November", "December", "January", "February", "March", "April", "May"];
        const recordMap = new Map(records.map(r => [r.month, r]));
        
        // Build full month list - include records that exist, and create empty placeholders for missing months
        const fullMonthlyData: RecordRow[] = monthOrder.map(month => {
          const record = recordMap.get(month);
          if (record) {
            return record;
          }
          // Return placeholder for missing months (will show as "No data" in table)
          return {
            id: `placeholder-${month}`,
            admissionId,
            name: "",
            className: "",
            rollNo: "",
            scholarNo: "",
            month,
            year,
            totalSchoolFee: 0,
            scholarshipEarned: 0,
            pendingDue: 0,
            waiverGiven: 0,
            additionalCharge: 0,
            finalDue: 0,
            paidOnline: 0,
            status: "PENDING",
            attendancePercentage: null,
            homeworkPercentage: null,
            guardianRating: null,
            ptmAttended: false,
            attendanceAmount: 0,
            homeworkAmount: 0,
            guardianAmount: 0,
            ptmAmount: 0,
          };
        });
        
        setMonthlyData(fullMonthlyData);
        
        // Calculate totals from actual records only
        let sumDue = 0;
        let sumEarned = 0;
        let sumWaiver = 0;
        let sumCharge = 0;
        let sumPayable = 0;
        
        records.forEach((record) => {
          sumEarned += record.scholarshipEarned;
          sumWaiver += record.waiverGiven;
          sumCharge += record.additionalCharge;
          sumPayable += record.finalDue;
          
          if (record.status !== "PAID" && record.pendingDue > 0) {
            sumDue += record.pendingDue;
          }
        });
        
        setTotalEarned(sumEarned);
        setTotalWaiver(sumWaiver);
        setTotalCharge(sumCharge);
        setTotalPayable(sumPayable);
        setTotalDue(sumDue);
      }
    } catch (error) {
      console.error("Failed to load scholarship records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentInit = async () => {
    if (!selectedRecord) return;
    router.push(`/student/scholarship/${selectedRecord.id}/payment?month=${selectedRecord.month}&year=${selectedRecord.year}`);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Certificate Section */}
      {isScholarshipAwarded && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center space-y-3 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-sm uppercase tracking-wider">
            <span>🏆 Scholarship Certificate Available</span>
          </div>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Your scholarship award is active. Download your official certificate to keep for your records.
          </p>
          <a 
            href={`/api/scholarship/certificate?month=June&year=${year}`} 
            download 
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 animate-in fade-in duration-300"
          >
            <FileText size={14} />
            Download Certificate
          </a>
        </div>
      )}

      {/* Header with Year Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Scholarship Records</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">June to April monthly breakdown</p>
        </div>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="border p-2 rounded-md text-sm bg-white border-slate-300 font-semibold">
          {["2025", "2026", "2027"].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <SummaryCard label="Total Earned" value={totalEarned} color="text-emerald-600" />
          <SummaryCard label="Pending Due" value={totalDue} color="text-slate-800" />
          <SummaryCard label="Waiver Given" value={totalWaiver} color="text-blue-600" />
          <SummaryCard label="Additional Charge" value={totalCharge} color="text-amber-600" />
          <SummaryCard label="Net Payable" value={totalPayable} color="text-rose-600" highlight />
        </div>
      )}

      {/* Monthly Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold text-slate-500">Loading scholarship records...</p>
        </div>
      ) : monthlyData.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-black text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 tracking-wider">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Month</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">Attendance %</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">Homework %</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">Guardian</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">PTM</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right text-emerald-600">Sch. Earned</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">Pending Due</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right text-blue-600">Waiver</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right text-amber-600">Addl. Charge</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right text-rose-600 font-black">Net Payable</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right text-emerald-600 font-black">Paid Online</th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {monthlyData.map((record) => {
                  // Check if this is a placeholder (no actual data)
                  const isPlaceholder = record.id.startsWith("placeholder-");
                  
                  if (isPlaceholder) {
                    return (
                      <tr key={record.month} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{record.month}</td>
                        <td colSpan={10} className="px-4 py-3 text-center text-slate-400 text-sm font-medium">No data</td>
                        <td className="px-4 py-3 text-center">—</td>
                      </tr>
                    );
                  }

                  const att = record.attendancePercentage !== null && record.attendancePercentage !== undefined ? `${record.attendancePercentage.toFixed(1)}%` : "N/A";
                  const hw = record.homeworkPercentage !== null && record.homeworkPercentage !== undefined ? `${record.homeworkPercentage.toFixed(1)}%` : "N/A";
                  const guard = record.guardianRating !== null && record.guardianRating !== undefined ? `${record.guardianRating}/5` : "N/A";
                  const ptm = record.ptmAttended ? "Yes" : "No";

                  const isPending = record.status !== "PAID";
                  const pendingDue = record.pendingDue ?? 0;

                  return (
                    <tr 
                      key={record.month} 
                      className="hover:bg-blue-50/30 cursor-pointer transition-colors" 
                      onClick={() => {
                        if (record.status !== "PAID" && pendingDue > 0) {
                          router.push(`/student/scholarship/${record.id}/payment?month=${record.month}&year=${record.year}`);
                        }
                      }}
                    >
                      <td className="px-4 py-3 font-bold text-slate-800">{record.month}</td>
                      <td className="px-4 py-3 font-medium text-slate-600 text-right">{att}</td>
                      <td className="px-4 py-3 font-medium text-slate-600 text-right">{hw}</td>
                      <td className="px-4 py-3 font-medium text-slate-600 text-right">{guard}</td>
                      <td className="px-4 py-3 font-medium text-slate-600 text-right">
                        <span className={ptm === "Yes" ? "text-emerald-600 font-black" : "text-slate-300"}>
                          {ptm}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 text-right">₹{record.scholarshipEarned.toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-slate-600 text-right">₹{pendingDue.toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-blue-600 text-right">
                        {record.waiverGiven > 0 ? `₹${record.waiverGiven.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-amber-600 text-right">
                        {record.additionalCharge > 0 ? `₹${record.additionalCharge.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-black text-right">
                        <span className={record.finalDue > 0 ? "text-rose-600" : "text-emerald-600"}>
                          ₹{record.finalDue.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-right">
                        <span className={record.paidOnline > 0 ? "text-emerald-600 font-black" : "text-slate-300"}>
                          {record.paidOnline > 0 ? `₹${record.paidOnline.toLocaleString()}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${
                          record.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : record.status === "SCHOLARSHIP FULL AWARDED"
                            ? "bg-green-100 text-green-700"
                            : record.status === "APPROVED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.status !== "PAID" && pendingDue > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/student/scholarship/${record.id}/payment?month=${record.month}&year=${record.year}`);
                            }}
                            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                          >
                            👁️ View Now
                          </button>
                        ) : record.status === "PAID" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-black text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            ✓ Paid
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
          No scholarship records found for {year}.
        </div>
      )}

      {/* Total Outstanding Due Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Total Outstanding Due</h3>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Sum of all pending months in {year}</p>
        </div>
        <div className="text-right">
          {totalDue > 0 ? (
            <span className="text-2xl font-black text-rose-400">₹{totalDue}</span>
          ) : (
            <span className="text-xs font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full border border-emerald-500/30">
              No Due
            </span>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full md:max-w-lg md:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 sticky top-0">
              <div>
                <h2 className="text-lg font-black text-white">Pay Pending Balance</h2>
                <p className="text-xs text-slate-400 font-medium">{selectedRecord.month} {year}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            {/* Payment Details */}
            <div className="px-6 py-5 space-y-5">
              {(() => {
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

                const { discountNote, chargeNote } = parseAdjustmentNotes(selectedRecord.adjustmentNote);

                return (
                  <>
                    {/* Scholarship Details Section */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Scholarship Criteria Results</h3>
                      <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <div>
                            <span className="text-slate-600 font-medium">Attendance</span>
                            <div className="text-xs text-slate-500">
                              <span>{selectedRecord.attendancePercentage !== null && selectedRecord.attendancePercentage !== undefined ? `${selectedRecord.attendancePercentage.toFixed(1)}%` : "N/A"}</span>
                              {((selectedRecord as any).totalDays || 0) > 0 && (
                                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                                  Total: {(selectedRecord as any).totalDays}d (P: {(selectedRecord as any).presentDays || 0}, A: {(selectedRecord as any).absentDays || 0}, ML: {(selectedRecord as any).mlDays || 0}, HD: {(selectedRecord as any).halfDays || 0}, L: {(selectedRecord as any).leaveDays || 0})
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-emerald-600">₹{selectedRecord.attendanceAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <div>
                            <span className="text-slate-600">Homework</span>
                            <span className="text-xs text-slate-500 block">
                              {selectedRecord.homeworkPercentage !== null && selectedRecord.homeworkPercentage !== undefined ? `${selectedRecord.homeworkPercentage.toFixed(1)}%` : "N/A"}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600">₹{selectedRecord.homeworkAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <div>
                            <span className="text-slate-600">Guardian Rating</span>
                            <span className="text-xs text-slate-500 block">
                              {selectedRecord.guardianRating !== null && selectedRecord.guardianRating !== undefined ? `${selectedRecord.guardianRating}/5` : "N/A"}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600">₹{selectedRecord.guardianAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <div>
                            <span className="text-slate-600">PTM Attended</span>
                            <span className="text-xs text-slate-500 block">
                              {selectedRecord.ptmAttended ? "Yes ✓" : "No"}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600">₹{selectedRecord.ptmAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Fee Breakdown Section */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Fee Summary</h3>
                      <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-slate-600">School Fee</span>
                          <span className="font-bold text-slate-800">₹{selectedRecord.totalSchoolFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-slate-600">Scholarship Earned</span>
                          <span className="font-bold text-emerald-600">- ₹{selectedRecord.scholarshipEarned.toLocaleString()}</span>
                        </div>
                        {selectedRecord.waiverGiven > 0 && (
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-sm font-medium">
                              <span className="text-slate-600">Waiver/Discount</span>
                              <span className="font-bold text-blue-600">- ₹{selectedRecord.waiverGiven.toLocaleString()}</span>
                            </div>
                            {discountNote && (
                              <p className="text-[11px] font-semibold text-blue-500/90 pl-1 italic">
                                Note: {discountNote}
                              </p>
                            )}
                          </div>
                        )}
                        {selectedRecord.additionalCharge > 0 && (
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-sm font-medium">
                              <span className="text-slate-600">Additional Charge</span>
                              <span className="font-bold text-amber-600">+ ₹{selectedRecord.additionalCharge.toLocaleString()}</span>
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
                          <span className="text-rose-600">₹{selectedRecord.finalDue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              <button
                onClick={() => handlePaymentInit()}
                disabled={paying}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
              >
                {paying ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  `💳 Pay ₹${selectedRecord.finalDue.toLocaleString()} Now`
                )}
              </button>
            </div>

            {/* Close Button */}
            <div className="px-6 py-3 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setSelectedRecord(null)}
                className="flex-1 px-5 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function SummaryCard({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center gap-1 ${
        highlight
          ? "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-100"
          : "bg-white border-slate-100"
      }`}
    >
      <span className={`text-[10px] font-black uppercase tracking-wider text-center ${highlight ? "text-rose-500" : "text-slate-400"}`}>
        {label}
      </span>
      <span className={`text-xl md:text-2xl font-black ${color}`}>
        ₹{value.toLocaleString()}
      </span>
    </div>
  );
}
