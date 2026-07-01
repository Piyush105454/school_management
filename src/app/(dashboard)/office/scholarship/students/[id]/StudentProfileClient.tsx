"use client";

import { useState, useEffect } from "react";
import { getStudentKpiData, saveKpiData, getStudentMonthlyOverview } from "@/features/scholarship/actions/kpiActions";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Upload, Trash2, Image as ImageIcon, ExternalLink, Loader2, Check } from "lucide-react";
import { proxyUploadDocument } from "@/features/admissions/actions/admissionActions";
import { ensureCompressed } from "@/lib/compression";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface CategoryState {
  rating: number;
  comment: string;
}

export default function StudentProfileClient({ id, student }: { id: string, student: any }) {
  const { data: session } = useSession();
  const router = useRouter();
  const isTeacher = session?.user?.role === "TEACHER";
  const [selectedMonth, setSelectedMonth] = useState("");
  const [year, setYear] = useState("2026");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [data, setData] = useState<any>(null);
  const [monthlyOverview, setMonthlyOverview] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const [ptmAttended, setPtmAttended] = useState<boolean>(false);
  const [ptmImages, setPtmImages] = useState<string[]>([]);
  const [attendee, setAttendee] = useState<string>("");
  const [guardianName, setGuardianName] = useState<string>("");
  const [guardianRelation, setGuardianRelation] = useState<string>("");
  const [guardianComments, setGuardianComments] = useState<Record<string, CategoryState>>({});
  const [uploading, setUploading] = useState<boolean>(false);
  const [isHwEditing, setIsHwEditing] = useState(false);

  const { register, handleSubmit, reset, watch, setValue } = useForm<any>({
    defaultValues: {
      attendance: { totalDays: 0, presentDays: 0 },
      homework: { totalGiven: 0, totalDone: 0 },
      guardian: { rating: 0 },
      ptm: { attended: false },
      adjustment: { type: "NONE", discountAmount: "", additionalChargeAmount: "", note: "" }
    }
  });
  const guardianRating = watch("guardian.rating") || 0;
  const adjType = watch("adjustment.type") || "NONE";
  const discountAmtInput = Number(watch("adjustment.discountAmount") || 0);
  const additionalChargeAmtInput = Number(watch("adjustment.additionalChargeAmount") || 0);

  const calculatedGuardianRating = (() => {
    const vals = Object.values(guardianComments).map(c => c.rating || 0).filter(v => v > 0);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  })();

  // Change Category Rating
  const handleRatingChange = (key: string, val: number) => {
    setGuardianComments(prev => {
      const current = prev[key] || { rating: 5, comment: "" };
      return {
        ...prev,
        [key]: {
          ...current,
          rating: val
        }
      };
    });
  };

  // Change Category Comment
  const handleCommentChange = (key: string, val: string) => {
    setGuardianComments(prev => {
      const current = prev[key] || { checked: false, comment: "" };
      return {
        ...prev,
        [key]: {
          ...current,
          comment: val
        }
      };
    });
  };

  // Handle parent image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setMessage("");
    
    try {
      const currentImages = [...ptmImages];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await ensureCompressed(file, 0.5);
        
        const formData = new FormData();
        formData.append("file", compressed);
        formData.append("admissionId", id);
        formData.append("category", "scholarship-ptm");
        
        const res = await proxyUploadDocument(formData);
        if (res.success && res.publicUrl) {
          currentImages.push(res.publicUrl);
        } else {
          throw new Error(res.error || "File upload failed.");
        }
      }
      
      setPtmImages(currentImages);
      setMessage("Parent image(s) uploaded successfully! Click save to persist.");
    } catch (err: any) {
      setMessage("Error uploading: " + (err.message || "Upload failed."));
    } finally {
      setUploading(false);
    }
  };

  // Delete local uploaded parent image
  const handleDeleteImage = (imgIdx: number) => {
    if (!confirm("Are you sure you want to remove this image?")) return;
    setPtmImages(prev => prev.filter((_, i) => i !== imgIdx));
  };

  const guardianCategories = [
    "Smooth communication with parent and teacher",
    "Supporting child with homework",
    "Supporting child health and wellness",
    "Supporting in-school development in class",
    "Other"
  ];

  useEffect(() => {
    loadOverview();
  }, [year]);

  useEffect(() => {
    if (selectedMonth) {
      loadData();
    }
  }, [selectedMonth, year]);

  const loadOverview = async () => {
    setLoadingOverview(true);
    const res = await getStudentMonthlyOverview(id, year);
    if (res.success) setMonthlyOverview(res.data || []);
    setLoadingOverview(false);
  };

  const loadData = async () => {
    setLoading(true);
    // Fetch both KPI data and overview in parallel for better responsiveness
    const [kpiRes, overviewRes] = await Promise.all([
      getStudentKpiData(id, selectedMonth, year),
      getStudentMonthlyOverview(id, year)
    ]);

    if (kpiRes.success && kpiRes.data) {
      setData(kpiRes.data);
      const discountAmt = kpiRes.data.record?.discountAmount || 0;
      const additionalChargeAmt = kpiRes.data.record?.additionalChargeAmount || 0;
      const adjAmt = kpiRes.data.record?.adjustmentAmount || 0;
      
      let initialDiscount = discountAmt;
      let initialAdditional = additionalChargeAmt;
      if (discountAmt === 0 && additionalChargeAmt === 0 && adjAmt !== 0) {
        if (adjAmt < 0) {
          initialDiscount = Math.abs(adjAmt);
        } else {
          initialAdditional = adjAmt;
        }
      }

      let loadedType = "NONE";
      if (initialDiscount > 0 && initialAdditional > 0) {
        loadedType = "BOTH";
      } else if (initialDiscount > 0) {
        loadedType = "DISCOUNT";
      } else if (initialAdditional > 0) {
        loadedType = "CHARGE";
      }

      setPtmAttended(kpiRes.data.ptm?.attended || false);
      setAttendee(kpiRes.data.ptm?.attendee || "");
      setGuardianName(kpiRes.data.ptm?.guardianName || "");
      setGuardianRelation(kpiRes.data.ptm?.guardianRelation || "");
      
      let parsedComments: Record<string, CategoryState> = {};
      const commentsJson = kpiRes.data.guardian?.comments;
      if (commentsJson) {
        try {
          parsedComments = JSON.parse(commentsJson);
        } catch(e) {
          console.error("Failed to parse guardian comments", e);
        }
      }
      guardianCategories.forEach((_, idx) => {
        const key = `cat_${idx}`;
        if (!parsedComments[key]) {
          parsedComments[key] = { rating: 5, comment: "" };
        } else if ((parsedComments[key] as any).checked !== undefined && parsedComments[key].rating === undefined) {
          parsedComments[key].rating = (parsedComments[key] as any).checked ? 5 : 1;
        }
      });
      setGuardianComments(parsedComments);

      let parsedImages: string[] = [];
      const imagesJson = kpiRes.data.ptm?.parentImages;
      if (imagesJson) {
        try {
          parsedImages = JSON.parse(imagesJson);
        } catch(e) {
          console.error("Failed to parse parent images", e);
        }
      }
      setPtmImages(parsedImages);

      reset({
        attendance: {
          totalDays: kpiRes.data.attendance?.totalDays || kpiRes.data.calculatedAttendance?.totalDays || 0,
          presentDays: kpiRes.data.attendance?.presentDays || kpiRes.data.calculatedAttendance?.presentDays || 0,
        },
        homework: {
          totalGiven: kpiRes.data.homework?.totalGiven ?? kpiRes.data.calculatedHomework?.totalGiven ?? 0,
          totalDone: kpiRes.data.homework?.totalDone ?? kpiRes.data.calculatedHomework?.totalDone ?? 0,
        },
        guardian: {
          rating: kpiRes.data.guardian?.rating || 0,
        },
        ptm: {
          attended: kpiRes.data.ptm?.attended || false,
        },
        adjustment: {
          type: loadedType,
          discountAmount: initialDiscount !== 0 ? initialDiscount : "",
          additionalChargeAmount: initialAdditional !== 0 ? initialAdditional : "",
          note: kpiRes.data.record?.adjustmentNote || ""
        }
      });
    }
    
    if (overviewRes.success) {
      setMonthlyOverview(overviewRes.data || []);
    }
    
    setLoading(false);
  };

  const onSubmit = async (formData: any) => {
    if (ptmAttended) {
      if (!attendee) {
        alert("Please select who attended the PTM.");
        return;
      }
      if (attendee === "Guardian") {
        if (!guardianName.trim()) {
          alert("Please fill in the Guardian's Name.");
          return;
        }
        if (!guardianRelation.trim()) {
          alert("Please fill in the Guardian's Relation.");
          return;
        }
      }
    }

    setLoading(true);
    setMessage("");
    const res = await saveKpiData(id, selectedMonth, year, {
      attendance: { totalDays: Number(formData.attendance.totalDays), presentDays: Number(formData.attendance.presentDays) },
      homework: { totalGiven: Number(formData.homework.totalGiven), totalDone: Number(formData.homework.totalDone) },
      guardian: { 
        rating: calculatedGuardianRating,
        comments: JSON.stringify(guardianComments)
      },
      ptm: { 
        attended: ptmAttended,
        parentImages: JSON.stringify(ptmImages),
        attendee: ptmAttended ? attendee : null,
        guardianName: ptmAttended && attendee === "Guardian" ? guardianName.trim() : null,
        guardianRelation: ptmAttended && attendee === "Guardian" ? guardianRelation.trim() : null
      },
      adjustment: isTeacher ? {
        discountAmount: data?.record?.discountAmount || 0,
        additionalChargeAmount: data?.record?.additionalChargeAmount || 0,
        note: data?.record?.adjustmentNote || ""
      } : {
        discountAmount: (formData.adjustment?.type === "DISCOUNT" || formData.adjustment?.type === "BOTH") 
          ? Number(formData.adjustment?.discountAmount || 0) 
          : 0,
        additionalChargeAmount: (formData.adjustment?.type === "CHARGE" || formData.adjustment?.type === "BOTH") 
          ? Number(formData.adjustment?.additionalChargeAmount || 0) 
          : 0,
        note: formData.adjustment?.note || ""
      }
    });
    setLoading(false);
    if (res.success) {
      const discount = isTeacher 
        ? (data?.record?.discountAmount || 0) 
        : ((formData.adjustment?.type === "DISCOUNT" || formData.adjustment?.type === "BOTH") ? Number(formData.adjustment?.discountAmount || 0) : 0);
      const additional = isTeacher 
        ? (data?.record?.additionalChargeAmount || 0) 
        : ((formData.adjustment?.type === "CHARGE" || formData.adjustment?.type === "BOTH") ? Number(formData.adjustment?.additionalChargeAmount || 0) : 0);
      const signedAdj = additional - discount;
      const baseTotal = res.totalAmount || 0;
      const totalCredit = baseTotal - signedAdj;
      
      let adjText = "";
      if (discount > 0 && additional > 0) {
        adjText = `-₹${discount} discount, +₹${additional} charge`;
      } else if (discount > 0) {
        adjText = `-₹${discount} discount`;
      } else if (additional > 0) {
        adjText = `+₹${additional} charge`;
      }
      
      if (adjText) {
        setMessage(`Saved Successfully! Scholarship: ₹${baseTotal} (${adjText}) | Net Credited: ₹${totalCredit}`);
      } else {
        setMessage(`Saved Successfully! Total Amount: ₹${baseTotal}`);
      }
      loadData(); 
      loadOverview(); // Refresh list as well
    } else {
      setMessage("Error: " + res.error);
    }
  };

  const record = data?.record;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => {
              if (selectedMonth) {
                setSelectedMonth("");
              } else {
                router.back();
              }
            }}
            className="p-2 border rounded-full hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{student?.studentName || "Student Details"}</h1>
            <p className="text-slate-500 text-sm">Scholar #: {student?.scholarNumber || "N/A"} | Admission #: {student?.admissionNumber || "N/A"}</p>
          </div>
        </div>
        {selectedMonth && (
          <button 
            onClick={() => setSelectedMonth("")}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2"
          >
            ← Back to Overview
          </button>
        )}
      </div>

      <div className="flex gap-4 max-w-sm">
        <select value={year} onChange={(e) => setYear(e.target.value)} className="border p-2 rounded-md text-sm bg-white border-slate-300 w-full font-semibold">
          {["2025", "2026", "2027"].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {!selectedMonth ? (
        // --- Monthly Overview View ---
        loadingOverview ? (
          <p>Loading monthly overview...</p>
        ) : monthlyOverview.length > 0 ? (
          <>
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="px-6 py-4">Month</th>
                    <th className="px-6 py-4">Attendance %</th>
                    <th className="px-6 py-4">Homework %</th>
                    <th className="px-6 py-4">Guardian</th>
                    <th className="px-6 py-4">PTM</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monthlyOverview.map((item) => (
                    <tr key={item.month} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{item.month}</td>
                      <td className="px-6 py-4">{item.attendance?.percentage !== null && item.attendance?.percentage !== undefined ? `${item.attendance.percentage.toFixed(1)}%` : "N/A"}</td>
                      <td className="px-6 py-4">{item.homework?.percentage !== null && item.homework?.percentage !== undefined ? `${item.homework.percentage.toFixed(1)}%` : "N/A"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {item.guardian?.locked && <span title="Locked" className="text-slate-400 text-xs">🔒</span>}
                          <span>
                            {(() => {
                              if (!item.guardian || !item.guardian.comments) return item.guardian?.rating !== null && item.guardian?.rating !== undefined ? `${item.guardian.rating}/5` : "N/A";
                              try {
                                const parsed = JSON.parse(item.guardian.comments);
                                const vals = Object.values(parsed).map((c: any) => c.rating || 0).filter(v => v > 0);
                                if (vals.length > 0) {
                                  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                                  return `${avg.toFixed(1)}/5`;
                                }
                              } catch {}
                              return item.guardian?.rating !== null && item.guardian?.rating !== undefined ? `${item.guardian.rating}/5` : "N/A";
                            })()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 animate-in fade-in-50">
                        <div className="flex items-center gap-1.5">
                          {item.ptm?.locked && <span title="Locked" className="text-slate-400 text-xs">🔒</span>}
                          {item.ptm ? (
                            item.ptm.attended ? (
                              <div className="flex flex-col">
                                <span className="text-green-600 font-bold">Yes</span>
                                {item.ptm.attendee && (
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                    {item.ptm.attendee === "Guardian" 
                                      ? `${item.ptm.guardianRelation || "Guardian"}: ${item.ptm.guardianName || "N/A"}`
                                      : item.ptm.attendee}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-red-500 font-bold">No</span>
                            )
                          ) : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-blue-600">₹{item.record?.totalAmount ?? 0}</span>
                          {item.record?.adjustmentAmount && item.record.adjustmentAmount !== 0 ? (
                            <span 
                              className={`text-[10px] font-black w-fit px-1.5 py-0.5 rounded mt-0.5 ${
                                item.record.adjustmentAmount < 0 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`} 
                              title={item.record.adjustmentNote || "No note provided"}
                            >
                              Adj: {item.record.adjustmentAmount < 0 ? "-" : "+"}₹{Math.abs(item.record.adjustmentAmount)}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedMonth(item.month)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-700"
                        >
                          Fill Score
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-500 text-center py-10">No data found for this year.</p>
          </div>
        )
      ) : (
        // --- Edit Form View ---
        loading && !data ? (
          <div className="flex h-[300px] items-center justify-center bg-white border border-slate-100 rounded-3xl p-10 shadow-sm w-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading form details...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-slate-100 px-4 py-2 rounded-md font-semibold text-slate-700">
            Filling Scores for: {selectedMonth} {year}
          </div>
          {(() => {
            const criteria = data?.criteria;
            const calcAttendancePct = data?.attendance?.percentage ?? data?.calculatedAttendance?.percentage ?? 0;
            const attendanceReward = Math.round(calcAttendancePct * ((criteria?.attendanceAmount || 750) / 100));

            const watchHwGiven = watch("homework.totalGiven");
            const watchHwDone = watch("homework.totalDone");
            const calcHomeworkGiven = watchHwGiven !== undefined ? Number(watchHwGiven) : (data?.homework?.totalGiven ?? data?.calculatedHomework?.totalGiven ?? 0);
            const calcHomeworkDone = watchHwDone !== undefined ? Number(watchHwDone) : (data?.homework?.totalDone ?? data?.calculatedHomework?.totalDone ?? 0);
            const calcHomeworkPct = calcHomeworkGiven > 0 ? (calcHomeworkDone / calcHomeworkGiven) * 100 : 0;
            const homeworkReward = Math.round(calcHomeworkPct * ((criteria?.homeworkAmount || 750) / 100));

            const maxGuardian = criteria?.guardianAmount ?? 750;
            const guardianScore = calculatedGuardianRating;
            const guardianReward = guardianScore >= 4 
              ? maxGuardian 
              : Math.round((guardianScore / 5) * maxGuardian);

            const isPtmSuccess = ptmAttended;
            const ptmReward = isPtmSuccess ? (criteria?.ptmAmount || 750) : 0;

            const totalEarned = attendanceReward + homeworkReward + guardianReward + ptmReward;

            const maxAttendance = criteria?.attendanceAmount ?? 750;
            const maxHomework = criteria?.homeworkAmount ?? 750;
            const maxPtm = criteria?.ptmAmount ?? 750;
            const maxTotal = maxAttendance + maxHomework + maxGuardian + maxPtm;
            const pendingToPay = maxTotal - totalEarned;

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard 
                    title="Attendance"
                    percentage={calcAttendancePct}
                    amount={attendanceReward}
                    success={calcAttendancePct >= (criteria?.attendanceThreshold || 90)}
                    requiredThreshold={criteria?.attendanceThreshold}
                    maxAmount={criteria?.attendanceAmount}
                  >
                    <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-black text-slate-400">Total Days</p>
                        <p className="text-lg font-black text-slate-700">{data?.attendance?.totalDays ?? data?.calculatedAttendance?.totalDays ?? 0}</p>
                        <input type="hidden" {...register("attendance.totalDays")} value={data?.attendance?.totalDays ?? data?.calculatedAttendance?.totalDays ?? 0} />
                      </div>
                      <div className="text-center border-l border-slate-200">
                        <p className="text-[10px] uppercase font-black text-slate-400">Present</p>
                        <p className="text-lg font-black text-emerald-600">{data?.attendance?.presentDays ?? data?.calculatedAttendance?.presentDays ?? 0}</p>
                        <input type="hidden" {...register("attendance.presentDays")} value={data?.attendance?.presentDays ?? data?.calculatedAttendance?.presentDays ?? 0} />
                      </div>
                    </div>
                    {calcAttendancePct < (criteria?.attendanceThreshold || 90) && calcAttendancePct > 0 && (
                      <p className="text-[10px] text-rose-500 font-bold mt-2 text-center italic">
                        Criteria not met for reward
                      </p>
                    )}
                  </KpiCard>

                  <KpiCard 
                    title="Homework"
                    percentage={calcHomeworkPct}
                    amount={homeworkReward}
                    success={calcHomeworkPct >= (criteria?.homeworkThreshold || 90)}
                    requiredThreshold={criteria?.homeworkThreshold}
                    maxAmount={criteria?.homeworkAmount}
                    action={!isTeacher && (
                      <button
                        type="button"
                        onClick={() => setIsHwEditing(!isHwEditing)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-black uppercase tracking-wider flex items-center gap-1 border border-blue-200 rounded px-1.5 py-0.5 bg-blue-50/50 transition-colors"
                      >
                        {isHwEditing ? "Done" : "Edit"}
                      </button>
                    )}
                  >
                    <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-black text-slate-400">Given</p>
                        <input 
                          type="number" 
                          min="0"
                          readOnly={isTeacher || !isHwEditing}
                          {...register("homework.totalGiven", { valueAsNumber: true })} 
                          className={`w-full text-center bg-transparent font-black text-lg outline-none mt-1 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            (isTeacher || !isHwEditing) 
                              ? "border-none cursor-default text-slate-700 select-none" 
                              : "border-b border-slate-300 focus:border-blue-500"
                          }`} 
                        />
                      </div>
                      <div className="text-center border-l border-slate-200 pl-4">
                        <p className="text-[10px] uppercase font-black text-slate-400">Done</p>
                        <input 
                          type="number" 
                          min="0"
                          readOnly={isTeacher || !isHwEditing}
                          {...register("homework.totalDone", { valueAsNumber: true })} 
                          className={`w-full text-center bg-transparent font-black text-lg outline-none mt-1 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            (isTeacher || !isHwEditing) 
                              ? "border-none cursor-default text-emerald-600 select-none" 
                              : "border-b border-slate-300 focus:border-emerald-500"
                          }`} 
                        />
                      </div>
                    </div>
                  </KpiCard>

                  <KpiCard 
                    title="Guardian Rating"
                    amount={guardianReward}
                    success={calculatedGuardianRating >= 4}
                    requiredThreshold={4}
                    maxAmount={criteria?.guardianAmount}
                    scoreDisplay={`${calculatedGuardianRating.toFixed(1)}/5`}
                  >
                    <div className="space-y-2.5 mt-3">
                      {guardianCategories.map((category, idx) => {
                        const key = `cat_${idx}`;
                        const state = guardianComments[key] || { rating: 5, comment: "" };

                        return (
                          <div 
                            key={key} 
                            className="border border-slate-100 bg-white rounded-xl p-3 transition-all duration-300 shadow-sm"
                          >
                            <div className="flex items-center gap-2.5">
                              <select
                                value={state.rating ?? 5}
                                onChange={(e) => handleRatingChange(key, Number(e.target.value))}
                                className="bg-white border border-slate-200 rounded-lg p-1 text-xs font-black text-slate-700 outline-none focus:border-amber-400 shrink-0"
                              >
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <option key={num} value={num}>{num}</option>
                                ))}
                              </select>
                              
                              <div className="flex-1 space-y-2">
                                <span className="text-[10px] leading-tight font-black text-slate-800 block">
                                  {category}
                                </span>

                                {/* Comment input field */}
                                <div className="transition-all animate-in fade-in-50 slide-in-from-top-1">
                                  <input 
                                    type="text" 
                                    placeholder="Add comment (optional)..."
                                    value={state.comment}
                                    onChange={(e) => handleCommentChange(key, e.target.value)}
                                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </KpiCard>

                  <KpiCard 
                    title="PTM Attended"
                    amount={ptmReward}
                    success={ptmAttended}
                    maxAmount={criteria?.ptmAmount}
                  >
                    <div className="space-y-4 mt-3">
                      {/* PTM Toggle Switch */}
                      <div className="flex items-center justify-between bg-slate-50/50 p-3 border border-slate-100 rounded-xl">
                        <div>
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Attended</span>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Meeting attendance status</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = !ptmAttended;
                            setPtmAttended(nextVal);
                            if (!nextVal) {
                              setAttendee("");
                              setGuardianName("");
                              setGuardianRelation("");
                            }
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            ptmAttended ? "bg-blue-600" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              ptmAttended ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* PTM Attendee Details */}
                      {ptmAttended && (
                        <div className="space-y-3 bg-slate-50/50 p-3 border border-slate-100 rounded-xl animate-in fade-in-50 slide-in-from-top-2 duration-300">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Who Attended the Meeting?</label>
                            <div className="flex flex-wrap gap-1.5">
                              {["Mother", "Father", "Both", "Guardian"].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    setAttendee(opt);
                                    if (opt !== "Guardian") {
                                      setGuardianName("");
                                      setGuardianRelation("");
                                    }
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                                    attendee === opt
                                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10"
                                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>

                          {attendee === "Guardian" && (
                            <div className="grid grid-cols-1 gap-2.5 animate-in fade-in-50 slide-in-from-top-2 duration-300">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Guardian Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. John Doe"
                                  value={guardianName}
                                  onChange={(e) => setGuardianName(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Relation</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Uncle"
                                  value={guardianRelation}
                                  onChange={(e) => setGuardianRelation(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* PTM Image Uploads */}
                      <div className="space-y-2.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Parent Images</label>
                        
                        {/* Image previews */}
                        {ptmImages.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {ptmImages.map((imgUrl, imgIdx) => (
                              <div key={imgIdx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                                <img 
                                  src={imgUrl} 
                                  alt="Parent meeting attachment" 
                                  className="h-full w-full object-cover" 
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                                  <a
                                    href={`/api/view-doc?id=${id}&field=${imgIdx}&type=ptm&month=${selectedMonth}&year=${year}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                                    title="View Full Image"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteImage(imgIdx)}
                                    className="p-1 bg-rose-500/80 hover:bg-rose-500 text-white rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400 text-[10px] font-bold">
                            No images uploaded.
                          </div>
                        )}

                        {/* Upload Input */}
                        <label className={`relative flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 p-3 rounded-xl transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                          <input 
                            type="file" 
                            className="hidden" 
                            multiple 
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                          {uploading ? (
                            <>
                              <Loader2 className="animate-spin w-3.5 h-3.5 text-blue-600" />
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon size={14} className="text-slate-400" />
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Upload Image(s)</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </KpiCard>
                </div>

                <div className={`grid grid-cols-1 ${isTeacher ? "max-w-2xl" : "md:grid-cols-2 max-w-4xl"} gap-6`}>
                  {/* Left Side: Adjustment Settings */}
                  {!isTeacher && (
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Internal Adjustment Settings</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Admin/Teacher Only</span>
                      </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Adjustment Type</label>
                        <select {...register("adjustment.type")} className="border p-2.5 rounded-xl text-sm bg-white border-slate-300 w-full font-semibold focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="NONE">No Adjustment (Use Calculated)</option>
                          <option value="DISCOUNT">Discount / Waiver (Reduce Pending)</option>
                          <option value="CHARGE">Additional Charge (Increase Pending)</option>
                          <option value="BOTH">Both (Discount & Additional Charge)</option>
                        </select>
                      </div>

                      {(adjType === "DISCOUNT" || adjType === "BOTH") && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Discount / Waiver (Reduce Pending) (₹)</label>
                          <input 
                            type="number" 
                            min="0"
                            {...register("adjustment.discountAmount")} 
                            placeholder="Enter discount in ₹"
                            className="border p-2.5 rounded-xl text-sm bg-white border-slate-300 w-full font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      )}

                      {(adjType === "CHARGE" || adjType === "BOTH") && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Additional Charge (Increase Pending) (₹)</label>
                          <input 
                            type="number" 
                            min="0"
                            {...register("adjustment.additionalChargeAmount")} 
                            placeholder="Enter charge in ₹"
                            className="border p-2.5 rounded-xl text-sm bg-white border-slate-300 w-full font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      )}

                      {adjType !== "NONE" && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Adjustment Reason / Note (Internal)</label>
                          <textarea 
                            rows={2}
                            {...register("adjustment.note")} 
                            placeholder="e.g. Student low-income waiver, offline balance adjustment"
                            className="border p-2.5 rounded-xl text-xs bg-white border-slate-300 w-full font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                  {/* Right Side: Calculation Summary */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Fee Summary</h4>
                      <div className="flex justify-between items-center text-sm font-bold text-slate-500 pt-2">
                        <span>Total School Fee</span>
                        <span>₹{maxTotal}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                        <span>Scholarship Earned</span>
                        <span>- ₹{totalEarned}</span>
                      </div>
                      
                      {(() => {
                        const isRecordPaid = record?.status === "PAID";
                        const discount = (adjType === "DISCOUNT" || adjType === "BOTH") ? discountAmtInput : 0;
                        const additional = (adjType === "CHARGE" || adjType === "BOTH") ? additionalChargeAmtInput : 0;
                        const signedAdj = additional - discount;
                        const originalPending = pendingToPay + signedAdj;
                        const finalPending = isRecordPaid ? 0 : originalPending;
                        
                        return (
                          <>
                            {discount > 0 && (
                              <div className="flex justify-between items-center text-sm font-bold text-blue-600">
                                <span>Adjustment (Discount)</span>
                                <span>- ₹{discount}</span>
                              </div>
                            )}
                            {additional > 0 && (
                              <div className="flex justify-between items-center text-sm font-bold text-amber-600">
                                <span>Adjustment (Charge)</span>
                                <span>+ ₹{additional}</span>
                              </div>
                            )}
                            {isRecordPaid && (
                              <div className="flex justify-between items-center text-sm font-bold text-blue-600">
                                <span>Amount Paid Online</span>
                                <span>- ₹{maxTotal - totalEarned}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center font-black text-lg text-rose-600 border-t border-dashed border-slate-200 pt-3">
                              <span>Pending Money to Pay</span>
                              <span>₹{finalPending}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    {adjType !== "NONE" && (discountAmtInput > 0 || additionalChargeAmtInput > 0) && (
                      <p className="text-[11px] text-slate-400 font-semibold italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                        * Note: This adjustment is stored internally for teacher/admin records and is **not** visible to the student.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {message && <p className={`text-sm text-center font-bold ${message.startsWith("Saved") ? "text-green-600" : "text-red-500"}`}>{message}</p>}

          <button type="submit" disabled={loading} className="w-full max-w-md bg-slate-900 text-white p-3 rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-300">
            {loading ? "Saving..." : "Calculate & Save Scores"}
          </button>
        </form>)
      )}
    </div>
  );
}

function KpiCard({ title, percentage, amount, success, requiredThreshold, maxAmount, scoreDisplay, action, children }: { title: string, percentage?: number, amount: number, success: boolean, requiredThreshold?: number, maxAmount?: number, scoreDisplay?: string, action?: React.ReactNode, children: React.ReactNode }) {

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            {action}
          </div>
          {percentage !== undefined && <p className="text-xs text-slate-400 font-medium">{percentage?.toFixed(1) ?? "0.0"}%</p>}
          {scoreDisplay && <p className="text-xs text-blue-600 font-black">{scoreDisplay}</p>}
          {(requiredThreshold !== undefined || maxAmount !== undefined) && (
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
              {requiredThreshold !== undefined ? `Req: ${requiredThreshold}${title === "Guardian Rating" ? "/5" : "%"}` : ""}
              {maxAmount !== undefined ? ` (Max: ₹${maxAmount})` : ""}
            </p>
          )}
        </div>
        {success ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : <XCircle className="text-slate-300 h-5 w-5" />}
      </div>
      <div className="flex-1 py-1">{children}</div>
      <div className="border-t pt-2 mt-2 flex justify-between items-center border-slate-100">
        <span className="text-xs text-slate-500">Reward</span>
        <span className={`font-bold text-sm ${success ? "text-green-600" : "text-slate-400"}`}>₹{amount}</span>
      </div>
    </div>
  );
}
