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
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(
        `${baseUrl}/api/lesson-plan?id=${params.id}`,
        {
          headers: { "Content-Type": "application/json" },
          cache: 'no-store',
        }
      );
      const result = await response.json();
      if (result.success) {
        existingData = result.data;
        console.log("Loaded existing data:", existingData); // Debug log
      } else {
        console.error("API returned error:", result);
      }
    } catch (error) {
      console.error("Failed to fetch lesson plan:", error);
    }
  }

  return <LessonPlanClient existingData={existingData} />;
}
