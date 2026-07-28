import { protectRoute } from "@/lib/roleGuard";
import LessonPlanClient from "@/app/(dashboard)/teacher/lesson-plan/LessonPlanClient";
import { db } from "@/db";
import { classes, subjects } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export default async function LessonPlanPage({ searchParams }: { searchParams: Promise<{ institute?: string; class?: string; subject?: string; chapterId?: string; chapterName?: string; pages?: string; divisionId?: string; divisionNo?: string; unitName?: string }> }) {
  await protectRoute(["TEACHER", "OFFICE", "PRINCIPAL"], "/office/academy-management/lesson-plan");

  // Unwrap searchParams Promise
  const params = await searchParams;
  console.log("🔍 Raw searchParams:", params);
  
  const selectedInstitute = params.institute ? decodeURIComponent(params.institute) : "Dhanpuri Public School";

  // Extract lesson plan creation parameters
  const classParam = params.class ? decodeURIComponent(params.class) : undefined;
  const subjectParam = params.subject ? decodeURIComponent(params.subject) : undefined;
  const chapterIdParam = params.chapterId ? parseInt(params.chapterId) : undefined;
  const chapterNameParam = params.chapterName ? decodeURIComponent(params.chapterName) : undefined;
  const pagesParam = params.pages ? decodeURIComponent(params.pages) : undefined;
  const divisionIdParam = params.divisionId ? parseInt(params.divisionId) : undefined;
  const divisionNoParam = params.divisionNo ? parseInt(params.divisionNo) : undefined;
  const unitNameParam = params.unitName ? decodeURIComponent(params.unitName) : undefined;
  
  console.log("📋 Extracted params:", { classParam, subjectParam, chapterIdParam, chapterNameParam, pagesParam, divisionIdParam, divisionNoParam, unitNameParam });

  // Fetch classes filtered by selected institute
  const allClasses = await db.query.classes.findMany({
    where: selectedInstitute ? eq(classes.institute, selectedInstitute) : undefined
  });

  // Fetch subjects for the selected institute's classes
  const classIds = allClasses.map(c => c.id);
  const allSubjects = classIds.length > 0 
    ? await db.query.subjects.findMany({
        where: inArray(subjects.classId, classIds),
        with: { class: true }
      })
    : [];

  // Build initial form data from URL parameters if creating new lesson plan
  const initialFormData = {
    ...(classParam && { className: classParam }),
    ...(subjectParam && { subject: subjectParam }),
    ...(chapterIdParam && { chapterId: chapterIdParam }),
    ...(chapterNameParam && { chapterName: chapterNameParam }),
    ...(divisionIdParam && { chapterDivisionId: divisionIdParam }),
    ...(divisionNoParam && { divisionNo: divisionNoParam }),
    ...(unitNameParam && { unitName: unitNameParam }),
    ...(pagesParam && { pages: pagesParam })
  };
  
  console.log("✅ Final initialFormData to pass:", initialFormData);

  return <LessonPlanClient initialClasses={allClasses} initialSubjects={allSubjects} selectedInstitute={selectedInstitute} initialFormData={initialFormData} />;
}
