import { protectRoute } from "@/lib/roleGuard";
import LessonPlanClient from "./LessonPlanClient";

export default async function LessonPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await protectRoute(["TEACHER"], "/teacher/lesson-plan");

  const params = await searchParams;
  let existingData = null;

  // If editing an existing lesson plan, fetch it
  if (params.id) {
    try {
      const response = await fetch(
        `${process.env.NEXTAUTH_URL}/api/lesson-plan?id=${params.id}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const result = await response.json();
      if (result.success) {
        existingData = result.data;
      }
    } catch (error) {
      console.error("Failed to fetch lesson plan:", error);
    }
  }

  return <LessonPlanClient existingData={existingData} />;
}
