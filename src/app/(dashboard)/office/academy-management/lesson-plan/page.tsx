import { protectRoute } from "@/lib/roleGuard";
import LessonPlanClient from "@/app/(dashboard)/teacher/lesson-plan/LessonPlanClient";
import { db } from "@/db";
import { classes, subjects, lessonPlans } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export default async function LessonPlanPage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    id?: string;
    institute?: string;
    class?: string;
    subject?: string;
    chapterId?: string;
    chapterName?: string;
    pages?: string;
    divisionId?: string;
    divisionNo?: string;
    unitName?: string;
  }>;
}) {
  await protectRoute(["TEACHER", "OFFICE", "PRINCIPAL"], "/office/academy-management/lesson-plan");

  // Unwrap searchParams Promise
  const params = await searchParams;
  const planIdToLoad = params.edit || params.id;
  let existingData = null;

  if (planIdToLoad) {
    try {
      const plan = await db.query.lessonPlans.findFirst({
        where: eq(lessonPlans.id, planIdToLoad),
        with: {
          class: true,
          subject: {
            with: {
              reviewer1: true,
              reviewer2: true,
            },
          },
          teacherProfile: true,
        },
      });

      if (plan) {
        let step1: any = {};
        let step2: any = {};

        try {
          if (plan.step1Data && typeof plan.step1Data === "string") {
            step1 = JSON.parse(plan.step1Data);
          } else if (plan.step1Data && typeof plan.step1Data === "object") {
            step1 = plan.step1Data;
          }
        } catch (e) {}

        try {
          if (plan.step2Data && typeof plan.step2Data === "string") {
            const parsed = JSON.parse(plan.step2Data);
            step2 =
              parsed.sharedData || parsed.explanationData || parsed.qaData
                ? { ...parsed.sharedData, ...parsed.explanationData, ...parsed.qaData, ...parsed }
                : parsed;
          } else if (plan.step2Data && typeof plan.step2Data === "object") {
            const parsed: any = plan.step2Data;
            step2 =
              parsed.sharedData || parsed.explanationData || parsed.qaData
                ? { ...parsed.sharedData, ...parsed.explanationData, ...parsed.qaData, ...parsed }
                : parsed;
          }
        } catch (e) {}

        existingData = {
          id: plan.id,
          className: plan.class?.name || step1.className || "",
          subject: plan.subject?.name || step1.subject || "",
          chapterNo: step1.chapterNo || "",
          chapterName: step1.chapterName || "",
          pageFrom: step1.pageFrom || "",
          pageTo: step1.pageTo || "",
          lessonType: plan.type === "QA" ? "Q&A" : (step1.lessonType || "Explanation"),
          preparedBy: step1.preparedBy || plan.teacherProfile?.name || "",
          reviewerName: step1.reviewerName || "",
          approverName: step1.approverName || "Academic Committee",
          prepDate: step1.prepDate || plan.date,
          deliveryDate: step1.deliveryDate || plan.date,
          ...step1,
          ...step2,
          reviewerRemark: plan.reviewerRemark || step2.reviewerRemark || step2.specialistFeedback || "",
          reviewerNote: plan.reviewerRemark || step2.reviewerNote || step2.specialistFeedback || "",
          specialistFeedback: plan.reviewerRemark || step2.specialistFeedback || step2.reviewerNote || "",
          principalRemark: plan.principalRemark || step2.principalRemark || step2.finalApprovalFeedback || "",
          approverNote: plan.principalRemark || step2.approverNote || step2.finalApprovalFeedback || "",
          finalApprovalFeedback: plan.principalRemark || step2.finalApprovalFeedback || step2.approverNote || "",
          status: plan.status,
          date: plan.date,
        };
      }
    } catch (error) {
      console.error("Failed to fetch existing lesson plan:", error);
    }
  }

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

  // Fetch classes filtered by selected institute
  const allClasses = await db.query.classes.findMany({
    where: selectedInstitute ? eq(classes.institute, selectedInstitute) : undefined,
  });

  // Fetch subjects for the selected institute's classes
  const classIds = allClasses.map((c) => c.id);
  const allSubjects =
    classIds.length > 0
      ? await db.query.subjects.findMany({
          where: inArray(subjects.classId, classIds),
          with: { class: true },
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
    ...(pagesParam && { pages: pagesParam }),
  };

  return (
    <LessonPlanClient
      initialClasses={allClasses}
      initialSubjects={allSubjects}
      selectedInstitute={selectedInstitute}
      initialFormData={initialFormData}
      existingData={existingData}
    />
  );
}

