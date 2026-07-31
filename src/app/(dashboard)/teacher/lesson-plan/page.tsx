import { protectRoute } from "@/lib/roleGuard";
import LessonPlanClient from "./LessonPlanClient";
import { db } from "@/db";
import { lessonPlans } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function LessonPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; edit?: string }>;
}) {
  await protectRoute(["TEACHER", "OFFICE", "PRINCIPAL"], "/teacher/lesson-plan");

  const params = await searchParams;
  const planIdToLoad = params.edit || params.id;
  let existingData = null;

  // If editing an existing lesson plan, fetch it from database
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
      console.error("Failed to fetch lesson plan:", error);
    }
  }

  return <LessonPlanClient existingData={existingData} />;
}

