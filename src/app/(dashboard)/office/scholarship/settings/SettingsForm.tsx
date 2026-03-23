"use client";

import { useForm } from "react-hook-form";
import { updateCriteriaSettings } from "@/features/scholarship/actions/criteriaActions";
import { useState } from "react";

export default function SettingsForm({ initialData, academicYear }: { initialData: any, academicYear: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { register, handleSubmit } = useForm({
    defaultValues: initialData || {
      attendanceThreshold: 90,
      attendanceAmount: 750,
      homeworkThreshold: 90,
      homeworkAmount: 750,
      guardianRatingThreshold: 8,
      guardianAmount: 750,
      ptmAmount: 750,
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setMessage("");
    const res = await updateCriteriaSettings(academicYear, {
      attendanceThreshold: Number(data.attendanceThreshold),
      attendanceAmount: Number(data.attendanceAmount),
      homeworkThreshold: Number(data.homeworkThreshold),
      homeworkAmount: Number(data.homeworkAmount),
      guardianRatingThreshold: Number(data.guardianRatingThreshold),
      guardianAmount: Number(data.guardianAmount),
      ptmAmount: Number(data.ptmAmount),
    });
    setLoading(false);
    if (res.success) {
      setMessage("Settings updated successfully!");
    } else {
      setMessage("Error: " + res.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Attendance Threshold (%)</label>
          <input type="number" {...register("attendanceThreshold")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Attendance Amount (₹)</label>
          <input type="number" {...register("attendanceAmount")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Homework Threshold (%)</label>
          <input type="number" {...register("homeworkThreshold")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Homework Amount (₹)</label>
          <input type="number" {...register("homeworkAmount")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Guardian Rating Threshold (1-10)</label>
          <input type="number" {...register("guardianRatingThreshold")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Guardian Amount (₹)</label>
          <input type="number" {...register("guardianAmount")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">PTM Amount (₹)</label>
          <input type="number" {...register("ptmAmount")} className="mt-1 block w-full border border-slate-300 rounded-md p-2" />
        </div>
      </div>

      {message && <p className={`text-sm ${message.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{message}</p>}

      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-slate-400">
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
