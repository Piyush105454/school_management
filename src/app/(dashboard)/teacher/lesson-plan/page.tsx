import { protectRoute } from "@/lib/roleGuard";
import LessonPlanClient from "./LessonPlanClient";

export default async function LessonPlanPage() {
  await protectRoute(["TEACHER"], "/teacher/lesson-plan");

  // TODO: Fetch existing lesson plan data if editing
  // const existingData = await getLessonPlan();

  return <LessonPlanClient existingData={undefined} />;
}
