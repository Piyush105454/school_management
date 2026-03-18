import { 
  Users, 
  FileText, 
  UserPlus, 
  Clock
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { inquiries, studentProfiles } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export default async function OfficeDashboard() {
  const totalInquiriesResult = await db.select({ count: count() }).from(inquiries);
  const shortlistedResult = await db.select({ count: count() }).from(inquiries).where(eq(inquiries.status, "SHORTLISTED"));
  const finalAdmissionsResult = await db.select({ count: count() }).from(studentProfiles).where(eq(studentProfiles.isFullyAdmitted, true));

  const stats = [
    { name: "Total Inquiries", value: totalInquiriesResult[0].count.toString(), icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Shortlisted", value: shortlistedResult[0].count.toString(), icon: UserPlus, color: "text-green-600", bg: "bg-green-100" },
    { name: "Final Admissions", value: finalAdmissionsResult[0].count.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Office Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.name}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/office/inquiries" className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors uppercase text-sm tracking-wider">
              New Inquiry
              <UserPlus className="h-5 w-5" />
            </Link>
            <Link href="/office/document-verification" className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors uppercase text-sm tracking-wider">
              Document Verification
              <FileText className="h-5 w-5 text-slate-400" />
            </Link>
            <Link href="/office/entrance-tests" className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors uppercase text-sm tracking-wider">
              Schedule Entrance Exam
              <Clock className="h-5 w-5 text-slate-400" />
            </Link>
            <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors uppercase text-sm tracking-wider">
              Generate Report
              <FileText className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
