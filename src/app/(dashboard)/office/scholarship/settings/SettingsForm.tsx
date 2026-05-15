"use client";

import { useForm } from "react-hook-form";
import { updateCriteriaSettings, getCriteriaSettings } from "@/features/scholarship/actions/criteriaActions";
import { getStudentsByClass } from "@/features/scholarship/actions/studentActions";
import { useState, useEffect } from "react";

export default function SettingsForm({ initialData, academicYear }: { initialData: any, academicYear: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [isAllStudents, setIsAllStudents] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [students, setStudents] = useState<any[]>([]);

  const classesList = ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  const { register, handleSubmit, reset } = useForm({
    defaultValues: initialData || {
      attendanceThreshold: 90,
      attendanceAmount: 750,
      homeworkThreshold: 90,
      homeworkAmount: 750,
      guardianRatingThreshold: 5,
      guardianAmount: 750,
      ptmAmount: 750,
    }
  });

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (isAllStudents) {
      // Load global default
      reset(initialData);
    } else if (selectedStudent) {
      fetchOverride(selectedStudent);
    }
  }, [isAllStudents, selectedStudent]);

  const loadStudents = async () => {
    const res = await getStudentsByClass(selectedClass);
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
      // Fallback to initial row (global defaults) for editing
      reset(initialData || {
        attendanceThreshold: 90,
        attendanceAmount: 750,
        homeworkThreshold: 90,
        homeworkAmount: 750,
        guardianRatingThreshold: 5,
        guardianAmount: 750,
        ptmAmount: 750,
      });
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setMessage("");
    
    const admissionId = !isAllStudents ? selectedStudent : undefined;
    
    // Prevent submitting for student with no ID
    if (!isAllStudents && !selectedStudent) {
      setMessage("Error: Please select a student");
      setLoading(false);
      return;
    }

    const res = await updateCriteriaSettings(academicYear, {
      attendanceThreshold: Number(data.attendanceThreshold),
      attendanceAmount: Number(data.attendanceAmount),
      homeworkThreshold: Number(data.homeworkThreshold),
      homeworkAmount: Number(data.homeworkAmount),
      guardianRatingThreshold: Number(data.guardianRatingThreshold),
      guardianAmount: Number(data.guardianAmount),
      ptmAmount: Number(data.ptmAmount),
    }, admissionId);
    
    setLoading(false);
    if (res.success) {
      setMessage("Settings updated successfully!");
    } else {
      setMessage("Error: " + res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
        <label className="block text-sm font-bold text-slate-800">Target Segment</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={isAllStudents} onChange={() => { setIsAllStudents(true); setSelectedStudent(""); }} />
            <span>All Students (Global Default)</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={!isAllStudents} onChange={() => setIsAllStudents(false)} />
            <span>Specific Student override</span>
          </label>
        </div>

        {!isAllStudents && (
          <div className="flex gap-2 mt-2">
            <select 
              value={selectedClass} 
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudent(""); }}
              className="border p-2 rounded-md text-sm bg-white border-slate-300 w-1/2"
            >
              <option value="">-- Select Class --</option>
              {classesList.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
            </select>

            <select 
              value={selectedStudent} 
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={!selectedClass || students.length === 0}
              className="border p-2 rounded-md text-sm bg-white border-slate-300 w-1/2 disabled:bg-slate-100"
            >
              <option value="">-- Select Student --</option>
              {students.map((student) => (
                <option key={student.admissionId} value={student.admissionId}>
                  {student.studentName} {student.scholarNumber ? `(#${student.scholarNumber})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <label className="block text-sm font-medium text-slate-700">Guardian Rating Threshold (1-5 points)</label>
            <input type="number" max={5} min={1} {...register("guardianRatingThreshold")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
            <p className="text-[10px] text-slate-400 mt-1 italic">Based on 5 criteria: Communication, Homework Support, Health/Wellness, School Dev, and Other.</p>
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

        {message && <p className={`text-sm ${message.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{message}</p>}

        <button 
          type="submit" 
          disabled={loading || (!isAllStudents && !selectedStudent)} 
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-slate-300 font-bold"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
