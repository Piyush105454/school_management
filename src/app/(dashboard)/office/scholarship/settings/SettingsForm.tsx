"use client";

import { useForm } from "react-hook-form";
import { updateCriteriaSettings, getCriteriaSettings } from "@/features/scholarship/actions/criteriaActions";
import { getStudentsByClass } from "@/features/scholarship/actions/studentActions";
import { useState, useEffect } from "react";

const DEFAULT_CRITERIA = {
  attendanceThreshold: 90,
  attendanceAmount: 750,
  homeworkThreshold: 90,
  homeworkAmount: 750,
  guardianRatingThreshold: 5,
  guardianAmount: 750,
  ptmAmount: 750,
};

export default function SettingsForm({
  initialData,
  academicYear,
  institutes,
  classesByInstitute,
}: {
  initialData: any;
  academicYear: string;
  institutes: string[];
  classesByInstitute: Record<string, string[]>;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Step 1: Institute
  const [selectedInstitute, setSelectedInstitute] = useState("");

  // Step 2: Segment — default to "specific"
  const [isAllStudents, setIsAllStudents] = useState(false);

  // Step 3: Student selector
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: DEFAULT_CRITERIA,
  });

  // Load students when class or institute changes
  useEffect(() => {
    if (selectedClass && selectedInstitute) {
      loadStudents();
    } else {
      setStudents([]);
      setSelectedStudent("");
    }
  }, [selectedClass, selectedInstitute]);

  // Load criteria when segment / student changes
  useEffect(() => {
    if (!selectedInstitute) return;

    if (isAllStudents) {
      // Fetch global default (no admissionId)
      (async () => {
        const res = await getCriteriaSettings(academicYear);
        if (res.success && res.data) {
          reset(res.data);
        } else {
          reset(DEFAULT_CRITERIA);
        }
      })();
      setSelectedClass("");
      setSelectedStudent("");
    } else if (selectedStudent) {
      fetchOverride(selectedStudent);
    } else {
      reset(DEFAULT_CRITERIA);
    }
  }, [isAllStudents, selectedStudent, selectedInstitute]);

  const loadStudents = async () => {
    setLoadingStudents(true);
    const res = await getStudentsByClass(selectedClass, selectedInstitute);
    setLoadingStudents(false);
    if (res.success) {
      setStudents(res.data || []);
    }
  };

  const fetchOverride = async (admissionId: string) => {
    setLoading(true);
    const res = await getCriteriaSettings(academicYear, admissionId);
    setLoading(false);
    if (res.success && res.data) {
      reset(res.data);
    } else {
      reset(DEFAULT_CRITERIA);
    }
  };

  const onSubmit = async (data: any) => {
    if (!selectedInstitute) {
      setMessage("Error: Please select an institute first.");
      return;
    }
    if (!isAllStudents && !selectedStudent) {
      setMessage("Error: Please select a student.");
      return;
    }

    setLoading(true);
    setMessage("");
    const admissionId = !isAllStudents ? selectedStudent : undefined;

    const res = await updateCriteriaSettings(
      academicYear,
      {
        attendanceThreshold: Number(data.attendanceThreshold),
        attendanceAmount: Number(data.attendanceAmount),
        homeworkThreshold: Number(data.homeworkThreshold),
        homeworkAmount: Number(data.homeworkAmount),
        guardianRatingThreshold: Number(data.guardianRatingThreshold),
        guardianAmount: Number(data.guardianAmount),
        ptmAmount: Number(data.ptmAmount),
      },
      admissionId
    );

    setLoading(false);
    if (res.success) {
      setMessage("Settings updated successfully!");
    } else {
      setMessage("Error: " + res.error);
    }
  };

  const formLocked = !selectedInstitute;
  const saveLocked = !selectedInstitute || (!isAllStudents && !selectedStudent);

  return (
    <div className="space-y-6">

      {/* ── Step 1: Institute ── */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
        <label className="block text-sm font-bold text-slate-800">
          Step 1 — Select Institute
        </label>
        <select
          value={selectedInstitute}
          onChange={(e) => {
            setSelectedInstitute(e.target.value);
            setSelectedClass("");
            setSelectedStudent("");
            setStudents([]);
            setMessage("");
          }}
          className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">— Select an Institute —</option>
          {institutes.map((inst) => (
            <option key={inst} value={inst}>{inst}</option>
          ))}
        </select>
      </div>

      {/* ── Step 2: Target Segment ── */}
      <div className={`bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 transition-opacity ${formLocked ? "opacity-40 pointer-events-none" : ""}`}>
        <label className="block text-sm font-bold text-slate-800">
          Step 2 — Target Segment
        </label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              checked={isAllStudents}
              onChange={() => { setIsAllStudents(true); setSelectedClass(""); setSelectedStudent(""); }}
              className="accent-blue-600"
            />
            <span className="font-medium">All Students (Global Default)</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              checked={!isAllStudents}
              onChange={() => setIsAllStudents(false)}
              className="accent-blue-600"
            />
            <span className="font-medium">Specific Student Override ✓</span>
          </label>
        </div>

        {/* Student Picker (only for Specific) */}
        {!isAllStudents && (
          <div className="flex gap-2 mt-2">
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudent(""); }}
              className="border border-slate-300 p-2 rounded-md text-sm bg-white w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">— Select Class —</option>
              {(classesByInstitute[selectedInstitute] || []).map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>

            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={!selectedClass || loadingStudents}
              className="border border-slate-300 p-2 rounded-md text-sm bg-white w-1/2 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">
                {loadingStudents
                  ? "Loading..."
                  : students.length === 0 && selectedClass
                  ? "No students found"
                  : "— Select Student —"}
              </option>
              {students.map((student) => (
                <option key={student.admissionId} value={student.admissionId}>
                  {student.studentName}
                  {student.scholarNumber ? ` (#${student.scholarNumber})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Step 3: Criteria Form ── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`space-y-4 transition-opacity ${formLocked ? "opacity-40 pointer-events-none" : ""}`}
      >
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Step 3 — Configure Criteria
          {!isAllStudents && selectedStudent
            ? ` (Override for selected student)`
            : isAllStudents
            ? ` (Global Default — all students)`
            : ""}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Attendance Threshold (%)</label>
            <input type="number" {...register("attendanceThreshold")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Attendance Amount (₹)</label>
            <input type="number" {...register("attendanceAmount")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Homework Threshold (%)</label>
            <input type="number" {...register("homeworkThreshold")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Homework Amount (₹)</label>
            <input type="number" {...register("homeworkAmount")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Guardian Rating Threshold (1–5 pts)</label>
            <input type="number" max={5} min={1} {...register("guardianRatingThreshold")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
            <p className="text-[10px] text-slate-400 mt-1 italic">
              Based on 5 criteria: Communication, Homework Support, Health/Wellness, School Dev, and Other.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Guardian Amount (₹)</label>
            <input type="number" {...register("guardianAmount")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">PTM Amount (₹)</label>
            <input type="number" {...register("ptmAmount")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
          </div>
        </div>

        {message && (
          <p className={`text-sm font-medium ${message.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || saveLocked}
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-slate-300 font-bold transition-colors"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
