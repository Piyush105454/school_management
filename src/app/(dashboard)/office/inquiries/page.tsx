import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { desc } from "drizzle-orm";
import { InquiryManager } from "@/features/admissions/components/InquiryManager";

export const dynamic = "force-dynamic";

import { protectRoute } from "@/lib/roleGuard";

export default async function OfficeInquiriesPage() {
  const session = await protectRoute(["OFFICE", "TEACHER"]);
  const role = session.user?.role;
  
  const allInquiries = await db.query.inquiries.findMany({
    orderBy: [desc(inquiries.createdAt)],
  });

  return (
    <InquiryManager 
      allInquiries={allInquiries} 
      role={role as any}
    />
  );
}
