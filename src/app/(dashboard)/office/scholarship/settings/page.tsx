import { getCriteriaSettings } from "@/features/scholarship/actions/criteriaActions";
import SettingsForm from "./SettingsForm";

export default async function CriteriaSettingsPage() {
  const academicYear = "2025-26"; // Default
  const settingsResult = await getCriteriaSettings(academicYear);
  const settings = settingsResult.success ? settingsResult.data : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Criteria Settings</h1>
        <p className="text-slate-500 mt-1">Configure scholarship thresholds and reward amounts.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-2xl">
        <SettingsForm initialData={settings} academicYear={academicYear} />
      </div>
    </div>
  );
}
