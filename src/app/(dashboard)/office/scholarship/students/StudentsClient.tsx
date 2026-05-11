"use client";

import { useState, useEffect } from "react";
import { getStudentsByClass, getStudentCountsByClass } from "@/features/scholarship/actions/studentActions";
import Link from "next/link";
import { useInstitute } from "@/providers/InstituteProvider";

export default function StudentsClient({ classesList }: { classesList: string[] }) {
  const { selectedInstitute } = useInstitute();
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [classCounts, setClassCounts] = useState<{ appliedClass: string; studentCount: number | "Loading..." }[]>(
    classesList.map(c => ({ appliedClass: c, studentCount: "Loading..." }))
  );

  useEffect(() => {
    loadClassCounts();
  }, [selectedInstitute]);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass, selectedInstitute]);

  const loadClassCounts = async () => {
    const res = await getStudentCountsByClass(selectedInstitute);
    if (res.success) {
      setClassCounts(classesList.map(c => {
        const match = res.data?.find((d: any) => d.appliedClass === c);
        return { appliedClass: c, studentCount: match ? match.studentCount : 0 };
      }));
    } else {
      setClassCounts(classesList.map(c => ({ appliedClass: c, studentCount: 0 })));
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    const res = await getStudentsByClass(selectedClass, selectedInstitute);
    if (res.success) setStudents(res.data || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Scholarships</h1>
          <p className="text-slate-500 mt-1">Manage and view scholarship details for students.</p>
        </div>
        {selectedClass && (
          <button 
            onClick={() => setSelectedClass("")}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2"
          >
            ← Back to Classes
          </button>
        )}
      </div>

      {!selectedClass ? (
        // --- Class Summary View ---
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Class Name</th>
                <th className="px-6 py-4">Number of Students</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {classCounts.map((count) => (
                <tr key={count.appliedClass} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{count.appliedClass}</td>
                  <td className="px-6 py-4">
                    {count.studentCount === "Loading..." ? (
                      <span className="text-slate-400 italic">Loading...</span>
                    ) : (
                      count.studentCount
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedClass(count.appliedClass)}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-700"
                    >
                      View Students
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // --- Student List View ---

        loading ? (
          <p>Loading students...</p>
        ) : students.length > 0 ? (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-3 border-b">
              <span className="text-sm font-semibold text-slate-600">Students in Class: {selectedClass}</span>
            </div>
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Scholar #</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student) => (
                  <tr key={student.admissionId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{student.studentName}</td>
                    <td className="px-6 py-4">{student.scholarNumber || "N/A"}</td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/office/scholarship/students/${student.admissionId}`}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-700"
                      >
                        Scholarship
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No students found in {selectedClass} or not fully admitted.</p>
        )
      )}
    </div>
  );
}

