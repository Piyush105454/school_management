import { protectRoute } from "@/lib/roleGuard";
import { getMonthlyReports } from "@/features/scholarship/actions/reportActions";
import Link from "next/link";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ institute?: string }>;
}) {
  await protectRoute(["OFFICE"], "/office/scholarship/reports");
  const { institute } = await searchParams;
  const reportsResult = await getMonthlyReports(institute);
  const reports = (reportsResult.success && reportsResult.data) ? reportsResult.data : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monthly Reports</h1>
          <p className="text-slate-500 mt-1">Summary of scholarship distributions and statuses.</p>
        </div>
        <Link
          href="/office/scholarship/reports/students"
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2"
        >
          View Student Reports
        </Link>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-4">Month/Year</th>
              <th className="px-6 py-4">Pending</th>
              <th className="px-6 py-4">Approved</th>
              <th className="px-6 py-4">Paid</th>
              <th className="px-6 py-4">Total Amount (₹)</th>
              <th className="px-6 py-4">Disbursed (₹)</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => (
              <tr key={`${report.month}-${report.year}`} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{report.month} {report.year}</td>
                <td className="px-6 py-4">{report.pendingCount || 0}</td>
                <td className="px-6 py-4">{report.approvedCount || 0}</td>
                <td className="px-6 py-4 font-bold text-green-600">{report.paidCount || 0}</td>
                <td className="px-6 py-4 font-bold">₹{report.totalAmount || 0}</td>
                <td className="px-6 py-4 font-bold text-green-600">₹{report.paidAmount || 0}</td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/office/scholarship/reports/students?month=${report.month}&year=${report.year}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline mr-4"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">No reports data available yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

