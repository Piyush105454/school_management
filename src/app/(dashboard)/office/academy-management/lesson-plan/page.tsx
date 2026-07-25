import { protectRoute } from "@/lib/roleGuard";
import LessonPlanClient from "@/app/(dashboard)/teacher/lesson-plan/LessonPlanClient";

export default async function LessonPlanPage() {
  await protectRoute(["TEACHER", "OFFICE", "PRINCIPAL"], "/office/academy-management/lesson-plan");

  // TODO: Fetch existing lesson plan data if editing
  // const existingData = await getLessonPlan();

  return <LessonPlanClient />;
}
