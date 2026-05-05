import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { desc } from "drizzle-orm";
import { InquiryManager } from "@/features/admissions/components/InquiryManager";

export const dynamic = "force-dynamic";

import { protectRoute } from "@/lib/roleGuard";

export default async function OfficeInquiriesPage() {
  const session = await protectRoute(["OFFICE", "TEACHER"]);
  const role = session.user?.role;
  
  let filter = undefined;
  if (role === "TEACHER") {
    const teacherProfile = await db.query.teachers.findFirst({
      where: (t, { eq }) => eq(t.userId, session.user.id)
    });
    if (teacherProfile?.institute) {
      filter = (inq: any, { eq }: any) => eq(inq.school, teacherProfile.institute!);
    }
  }

  const allInquiries = await db.query.inquiries.findMany({
    where: filter,
    orderBy: [desc(inquiries.createdAt)],
  });

  return (
    <InquiryManager 
      allInquiries={allInquiries} 
      role={role as any}
    />
  );
}
