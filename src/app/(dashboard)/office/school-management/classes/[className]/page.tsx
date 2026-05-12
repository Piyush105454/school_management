import React from "react";
import Link from "next/link";
import { db } from "@/db";
import { inquiries, studentProfiles, admissionMeta, studentBio } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ArrowLeft, User, Phone } from "lucide-react";

export default async function ClassStudentsPage({ params, searchParams }: { params: Promise<{ className: string }>, searchParams: Promise<{ institute?: string }> }) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const className = decodeURIComponent(resolvedParams.className);
  const institute = resolvedSearchParams.institute || "Dhanpuri Public School";

  // Fetch students for this class and institute
  const students = await db
    .select({
      id: studentProfiles.id,
      studentName: inquiries.studentName,
      parentName: inquiries.parentName,
      phone: inquiries.phone,
      email: inquiries.email,
      gender: studentBio.gender,
      dob: studentBio.dob,
    })
    .from(studentProfiles)
    .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
    .innerJoin(inquiries, eq(admissionMeta.inquiryId, inquiries.id))
    .leftJoin(studentBio, eq(admissionMeta.id, studentBio.admissionId))
    .where(
      and(
        eq(studentProfiles.isFullyAdmitted, true),
        eq(inquiries.appliedClass, className),
        eq(inquiries.school, institute)
      )
    );

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Link 
          href="/office/school-management/classes"
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
            {["Nursery", "LKG", "UKG", "KG1", "KG2"].includes(className) || className.startsWith("Class ") ? className : `Class ${className}`} Admitted Students
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">List of all active and confirmed students joining this class.</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
          <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
            <User className="h-8 w-8" />
          </div>
          <p className="text-sm font-black text-slate-800 uppercase tracking-wide">No Admitted Students</p>
          <p className="text-xs text-slate-400 font-medium max-w-sm">There are no confirmed students in this class yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Parent Name</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">DOB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{student.studentName}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {student.parentName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        student.gender === 'M' ? 'bg-blue-50 text-blue-600' : 
                        student.gender === 'F' ? 'bg-pink-50 text-pink-600' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {student.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {student.dob ? new Date(student.dob).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
