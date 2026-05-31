"use client";

import React, { useState, useTransition, useRef } from "react";
import { Search, FileText, Printer, ChevronRight, User, Hash, GraduationCap } from "lucide-react";

interface TCClientProps {
  students: any[];
}

// Convert number to words for DOB
function numberToWords(n: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numberToWords(n % 100) : "");
  if (n < 10000) return ones[Math.floor(n / 1000)] + " Thousand" + (n % 1000 ? " " + numberToWords(n % 1000) : "");
  return String(n);
}

function dateToWords(date: Date): string {
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${numberToWords(day)} ${month} Two Thousand ${numberToWords(year - 2000)}`;
}

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export default function TCClient({ students }: TCClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [tcDate, setTcDate] = useState(new Date().toISOString().split("T")[0]);
  const [tcSrNo, setTcSrNo] = useState("");
  const [leavingClass, setLeavingClass] = useState("");
  const [leavingYear, setLeavingYear] = useState(new Date().getFullYear().toString());
  const [admissionYear, setAdmissionYear] = useState("");
  const [medium, setMedium] = useState("Hindi");
  const [conduct, setConduct] = useState("Good");
  const tcRef = useRef<HTMLDivElement>(null);

  const filtered = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.scholarNumber?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q) ||
      s.admissionNumber?.toLowerCase().includes(q)
    );
  });

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    // Pre-fill fields from student data
    setLeavingClass(student.className || student.appliedClass || "");
    setAdmissionYear(student.academicYear || "");
  };

  const handlePrint = () => {
    const printContent = tcRef.current;
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transfer Certificate - ${selectedStudent?.name || ""}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', Times, serif; background: white; }
            .tc-wrapper { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm 14mm; }
            @media print {
              body { margin: 0; }
              .tc-wrapper { padding: 10mm 12mm; }
            }
          </style>
        </head>
        <body>
          <div class="tc-wrapper">${printContent.innerHTML}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  const today = new Date(tcDate);
  const dobObj = selectedStudent?.dob ? new Date(selectedStudent.dob) : null;
  const dobFigure = dobObj ? formatDate(dobObj) : "___________";
  const dobWords = dobObj ? dateToWords(dobObj) : "___________";

  const fatherName = selectedStudent?.father?.name || selectedStudent?.parentName || "__________________";
  const motherName = selectedStudent?.mother?.name || "__________________";
  const studentName = selectedStudent?.name || "__________________";
  const scholarNo = selectedStudent?.scholarNumber || selectedStudent?.admissionNumber || "__________";
  const aadhaar = selectedStudent?.aadhaarNumber || "__________________";
  const samagra = selectedStudent?.samagraId || "__________________";
  const caste = selectedStudent?.caste || "__________";
  const religion = selectedStudent?.religion || "__________";
  const motherTongue = selectedStudent?.motherTongue || "Hindi";
  const gender = selectedStudent?.gender === "M" ? "Mr." : selectedStudent?.gender === "F" ? "Miss" : "Mr./Miss";

  // Address
  const village = selectedStudent?.village || "Dhanpuri";
  const tehsil = selectedStudent?.tehsil || "Sohagpur";
  const district = selectedStudent?.district || "Shahdol";
  const state = selectedStudent?.state || "M.P.";

  const admDate = selectedStudent?.createdAt ? formatDate(new Date(selectedStudent.createdAt)) : "__________";

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-blue-600" /> TC Generation
          </h1>
          <p className="text-slate-500 text-sm mt-1">Search student → auto-fill details → preview & print Transfer Certificate</p>
        </div>
        {selectedStudent && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Printer className="h-4 w-4" /> Print TC
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== LEFT PANEL: Student List ===== */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, roll no, scholar ID..."
                className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Student List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Students ({filtered.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[calc(100vh-280px)] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-slate-400 italic text-xs">No students found.</div>
              ) : (
                filtered.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStudent(s)}
                    className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 transition-all hover:bg-blue-50/50 group ${
                      selectedStudent?.id === s.id ? "bg-blue-50 border-l-2 border-l-blue-600" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        selectedStudent?.id === s.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {s.name?.charAt(0)?.toUpperCase() || "S"}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">{s.name}</div>
                        <div className="flex gap-2 mt-0.5">
                          {s.rollNumber && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Roll: {s.rollNumber}</span>
                          )}
                          {s.scholarNumber && (
                            <span className="text-[9px] font-bold text-blue-500 uppercase">Scholar: {s.scholarNumber}</span>
                          )}
                        </div>
                        {s.className && (
                          <span className="text-[9px] font-bold text-slate-400">Class: {s.className}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 ${selectedStudent?.id === s.id ? "text-blue-600" : "text-slate-300 group-hover:text-slate-500"}`} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ===== RIGHT PANEL: TC Preview + Controls ===== */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedStudent ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-24 text-center">
              <User className="h-12 w-12 text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold text-sm">Select a student from the list to generate TC</p>
              <p className="text-slate-300 text-xs mt-1">All available data will be auto-filled</p>
            </div>
          ) : (
            <>
              {/* TC Controls (extra fields) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">TC Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">S.No</label>
                    <input type="text" value={tcSrNo} onChange={e => setTcSrNo(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">TC Date</label>
                    <input type="date" value={tcDate} onChange={e => setTcDate(e.target.value)}
                      className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Leaving Class</label>
                    <input type="text" value={leavingClass} onChange={e => setLeavingClass(e.target.value)}
                      placeholder="e.g. Class 5"
                      className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Leaving Year</label>
                    <input type="text" value={leavingYear} onChange={e => setLeavingYear(e.target.value)}
                      placeholder="2024"
                      className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Admitted In Class</label>
                    <input type="text" value={admissionYear} onChange={e => setAdmissionYear(e.target.value)}
                      placeholder="e.g. KG / Class 1"
                      className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Medium</label>
                    <select value={medium} onChange={e => setMedium(e.target.value)}
                      className="w-full text-xs font-bold p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500">
                      <option>Hindi</option>
                      <option>English</option>
                      <option>Hindi / English</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Character</label>
                    <select value={conduct} onChange={e => setConduct(e.target.value)}
                      className="w-full text-xs font-bold p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500">
                      <option>Good</option>
                      <option>Excellent</option>
                      <option>Satisfactory</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ===== TC DOCUMENT PREVIEW ===== */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto">
                <div
                  ref={tcRef}
                  style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    width: "100%",
                    maxWidth: "700px",
                    margin: "0 auto",
                    border: "2px solid #000",
                    padding: "24px 28px",
                    backgroundColor: "#fff",
                    fontSize: "13px",
                    lineHeight: "1.8",
                    color: "#000",
                  }}
                >
                  {/* School Header */}
                  <div style={{ textAlign: "center", marginBottom: "8px" }}>
                    <div style={{ fontSize: "22px", fontWeight: "bold", color: "#b30000", letterSpacing: "1px" }}>
                      DHANPURI PUBLIC SCHOOL
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: "bold" }}>(ENGLISH MEDIUM)</div>
                    <div style={{ fontSize: "11px" }}>Dhanpuri Distt. Shahdol (M.P.) 484114</div>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#b30000", textDecoration: "underline", marginTop: "6px", letterSpacing: "0.5px" }}>
                      Transfer / School Leaving Certificate
                    </div>
                  </div>

                  {/* S.No & Scholar No */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", marginBottom: "4px" }}>
                    <span>S.No ........<u style={{ minWidth: "60px", display: "inline-block", paddingLeft: "4px" }}>{tcSrNo || "___"}</u></span>
                    <span>Scholar No. :- <u style={{ minWidth: "80px", display: "inline-block", paddingLeft: "4px" }}>{scholarNo}</u></span>
                  </div>

                  <div style={{ borderTop: "1px solid #000", marginBottom: "10px" }}></div>

                  {/* Line 1 */}
                  <div style={{ marginBottom: "6px" }}>
                    It is certified that the student Mr./Miss{" "}
                    <strong style={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: "200px", paddingLeft: "6px" }}>
                      {studentName}
                    </strong>
                  </div>

                  {/* Father */}
                  <div style={{ marginBottom: "6px" }}>
                    S/O/D/O. .......{" "}
                    <strong style={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: "260px", paddingLeft: "6px" }}>
                      {fatherName}
                    </strong>
                  </div>

                  {/* Mother */}
                  <div style={{ marginBottom: "6px" }}>
                    Mother&apos;s Name ........{" "}
                    <strong style={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: "240px", paddingLeft: "6px" }}>
                      {motherName}
                    </strong>
                  </div>

                  {/* Mother tongue + Category */}
                  <div style={{ marginBottom: "6px" }}>
                    Mother tongue ....<u>{motherTongue}</u>.... Category ....<u>{caste}</u>.... has been studying in Dhanpuri Public School,
                  </div>

                  {/* Address line */}
                  <div style={{ marginBottom: "6px" }}>
                    {village}, Tehsil – {tehsil}, Distt.– {district}, State– {state} from the date{" "}
                    <u style={{ minWidth: "100px", display: "inline-block" }}>{admDate}</u>{" "}
                    to <u style={{ minWidth: "100px", display: "inline-block" }}>{formatDate(today)}</u>{" "}
                    and now today on date{" "}
                    <u>{formatDate(today)}</u> Year <u>{leavingYear}</u>
                  </div>

                  {/* Leaving line */}
                  <div style={{ marginBottom: "6px" }}>
                    he / she is leaving the school.
                  </div>

                  {/* Dues line */}
                  <div style={{ marginBottom: "6px" }}>
                    He / She has paid all dues and fees of the school and has no dues of the school.
                  </div>

                  {/* DOB */}
                  <div style={{ marginBottom: "6px" }}>
                    According to the record of the school his/her Date of Birth (In Figure){" "}
                    <strong><u>{dobFigure}</u></strong>
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    (in word) <u style={{ minWidth: "340px", display: "inline-block", paddingLeft: "4px" }}>
                      <em>{dobWords}</em>
                    </u>
                  </div>

                  {/* Small pox */}
                  <div style={{ marginBottom: "6px" }}>
                    He has been vaccinated or he is free from any effect of small pox.
                  </div>

                  {/* Latest exam */}
                  <div style={{ marginBottom: "4px", fontWeight: "bold" }}>
                    Latest passed examination by him/her is as followed:-
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    Class <u style={{ minWidth: "80px", display: "inline-block", paddingLeft: "4px" }}>{leavingClass}</u>{" "}
                    Medium <u style={{ minWidth: "100px", display: "inline-block", paddingLeft: "4px" }}>{medium}</u>{" "}
                    Year <u style={{ minWidth: "70px", display: "inline-block", paddingLeft: "4px" }}>{leavingYear}</u>
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    He / She has been admitted in the class{" "}
                    <u style={{ minWidth: "80px", display: "inline-block", paddingLeft: "4px" }}>{admissionYear || "___"}</u>{" "}
                    in the year{" "}
                    <u style={{ minWidth: "70px", display: "inline-block", paddingLeft: "4px" }}>{selectedStudent?.academicYear || "___"}</u>
                  </div>
                  <div style={{ marginBottom: "14px" }}>
                    He / She had <u>{conduct}</u> Character.
                  </div>

                  {/* Child ID + Aadhaar */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontWeight: "bold" }}>
                    <span>Child Id <u style={{ minWidth: "120px", display: "inline-block", paddingLeft: "4px" }}>{samagra}</u></span>
                    <span>Aadhar no. <u style={{ minWidth: "130px", display: "inline-block", paddingLeft: "4px" }}>{aadhaar}</u></span>
                  </div>

                  {/* Date + Signatures */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "30px" }}>
                    <div>
                      <div>Date :- <u>{formatDate(today)}</u></div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ borderTop: "1px solid #000", paddingTop: "4px", width: "140px", textAlign: "center" }}>
                        <div style={{ fontSize: "11px" }}>Class Teacher</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ borderTop: "1px solid #000", paddingTop: "4px", width: "160px", textAlign: "center" }}>
                        <div style={{ fontWeight: "bold", fontSize: "11px" }}>Principal</div>
                        <div style={{ fontSize: "10px" }}>Dhanpuri Public School</div>
                        <div style={{ fontSize: "10px" }}>Dhanpuri Distt. Shahdol (M.P.)</div>
                        <div style={{ fontSize: "10px", fontStyle: "italic" }}>Signature with Seal</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
