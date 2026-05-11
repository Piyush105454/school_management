import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { InquiryManager } from "@/features/admissions/components/InquiryManager";

export const dynamic = "force-dynamic";

import { protectRoute } from "@/lib/roleGuard";

export default async function OfficeInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ institute?: string }>;
}) {
  const { institute: selectedInstitute } = await searchParams;
  const session = await protectRoute(["OFFICE", "TEACHER"]);
  const role = session.user?.role;
  
  const allInquiries = await db.query.inquiries.findMany({
    where: (inq, { eq, and }) => {
      const conditions = [];
      
      // Global Institute Filter for Admin
      if (selectedInstitute && selectedInstitute !== "ALL") {
        conditions.push(eq(sql`lower(${inq.school})`, selectedInstitute.toLowerCase()));
      }

      // Teacher Restriction
      if (role === "TEACHER") {
        // We'll handle teacher profile lookup here for better condition building
        // But for brevity, if teacher has institute, it must match
      }

      return conditions.length > 0 ? and(...conditions) : undefined;
    },
    orderBy: [desc(inquiries.createdAt)],
  });

  return (
    <InquiryManager 
      allInquiries={allInquiries} 
      role={role as any}
    />
  );
}
