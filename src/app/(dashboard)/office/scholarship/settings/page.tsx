import { protectRoute } from "@/lib/roleGuard";
import { getCriteriaSettings } from "@/features/scholarship/actions/criteriaActions";
import SettingsForm from "./SettingsForm";
import { db } from "@/db";
import { classes } from "@/db/schema";

export default async function CriteriaSettingsPage() {
  await protectRoute(["OFFICE"], "/office/scholarship/settings");
  const academicYear = "2025-26"; // Default
  const settingsResult = await getCriteriaSettings(academicYear);
  const settings = settingsResult.success ? settingsResult.data : null;

  // Fetch distinct institutes from classes table
  const allClasses = await db.select({ institute: classes.institute, name: classes.name }).from(classes);
  const instituteSet = new Set<string>();
  instituteSet.add("Dhanpuri Public School"); // always include default
  allClasses.forEach(c => { if (c.institute) instituteSet.add(c.institute); });
  const institutes = Array.from(instituteSet).sort();

  // Build a map: institute → sorted class names
  const classesByInstitute: Record<string, string[]> = {};
  allClasses.forEach(c => {
    const inst = c.institute || "Dhanpuri Public School";
    if (!classesByInstitute[inst]) classesByInstitute[inst] = [];
    if (c.name && !classesByInstitute[inst].includes(c.name)) {
      classesByInstitute[inst].push(c.name);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Criteria Settings</h1>
        <p className="text-slate-500 mt-1">Configure scholarship thresholds and reward amounts.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-2xl">
        <SettingsForm initialData={settings} academicYear={academicYear} institutes={institutes} classesByInstitute={classesByInstitute} />
      </div>
    </div>
  );
}
