"use client";

import { useState, useEffect } from "react";
import LessonPlanReadOnly from "./LessonPlanReadOnly";
import { useSearchParams } from "next/navigation";

export default function LessonPlanReviewPage() {
  const searchParams = useSearchParams();
  const [lessonPlan, setLessonPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasId, setHasId] = useState(false);

  useEffect(() => {
    const loadLessonPlan = async () => {
      try {
        const id = searchParams.get("id");
        if (!id) {
          setHasId(false);
          setLoading(false);
          return;
        }

        setHasId(true);
        console.log(`Fetching lesson plan with id: ${id}`);
        const response = await fetch(`/api/lesson-plan?id=${id}&t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("API Response:", result);

        if (result.success && result.data) {
          console.log("Lesson plan data:", result.data);
          setLessonPlan(result.data);
        } else {
          setError(`Failed to load lesson plan: ${result.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        console.error("Failed to load lesson plan:", err);
        setError(`Error loading lesson plan: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadLessonPlan();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading lesson plan...</div>
      </div>
    );
  }

  // If no ID provided, show a message to select a lesson plan
  if (!hasId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Lesson Plan Review</h2>
              <p className="text-slate-600 mb-6">Select a lesson plan from the list to review it in detail.</p>
              <p className="text-sm text-slate-500">Use the lesson plan list or click "Review" on a specific lesson plan to begin.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lessonPlan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error || "Failed to load lesson plan"}</p>
        </div>
      </div>
    );
  }

  return <LessonPlanReadOnly lessonPlanData={lessonPlan} />;
}
