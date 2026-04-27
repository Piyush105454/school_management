import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { desc } from "drizzle-orm";
import { InquiryManager } from "@/features/admissions/components/InquiryManager";

export const dynamic = "force-dynamic";

import { protectRoute } from "@/lib/roleGuard";

export default async function OfficeInquiriesPage() {
  await protectRoute(["OFFICE", "TEACHER"]);
  
  const allInquiries = await db.query.inquiries.findMany({
    orderBy: [desc(inquiries.createdAt)],
  });

  return (
    <InquiryManager 
      allInquiries={allInquiries} 
    />
  );
}
