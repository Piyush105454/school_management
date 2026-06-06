"use client";

import React, { useState, useEffect } from "react";
import { Lock, Check, RefreshCw, AlertCircle } from "lucide-react";

// The complete unified Master Sidebar Structure containing all system modules and pages
const MASTER_STRUCTURE = [
  // Dashboards
  { href: "/office/dashboard", roleNames: { OFFICE: "Dashboard", PRINCIPAL: "Dashboard" } },
  { href: "/teacher/dashboard", roleNames: { TEACHER: "Dashboard" } },
  { href: "/student/dashboard", roleNames: { STUDENT_PARENT: "Dashboard" } },

  // Admissions Category
  { type: "section", name: "Admissions" },
  { href: "/office/inquiries", roleNames: { OFFICE: "Inquiries", PRINCIPAL: "Inquiries", TEACHER: "Inquiries" } },
  { href: "/office/admissions-progress", roleNames: { OFFICE: "Admissions Progress", PRINCIPAL: "Admissions Progress", TEACHER: "Admissions Progress" } },
  { href: "/office/document-verification", roleNames: { OFFICE: "Doc Verification & Affidavit Upload", PRINCIPAL: "Doc Verification & Affidavit Upload", TEACHER: "Doc Verification & Affidavit" } },
  { href: "/office/entrance-tests", roleNames: { OFFICE: "Entrance Tests", PRINCIPAL: "Entrance Tests", TEACHER: "Entrance Tests" } },
  { href: "/office/home-visits", roleNames: { OFFICE: "Home Visits", PRINCIPAL: "Home Visits", TEACHER: "Home Visits" } },
  { href: "/office/final-admissions", roleNames: { OFFICE: "Final Approvals", PRINCIPAL: "Final Approvals" } },
  { href: "/student/admission", roleNames: { STUDENT_PARENT: "Admission Form & Summary" } },
  { href: "/student/admission?step=10", roleNames: { STUDENT_PARENT: "Doc Verification & Affidavit Upload" } },
  { href: "/student/entrance-test", roleNames: { STUDENT_PARENT: "Entrance Test" } },
  { href: "/student/home-visit", roleNames: { STUDENT_PARENT: "Home Visit" } },

  // Scholarship Category
  { type: "section", name: "Scholarship" },
  { href: "/office/scholarship/award", roleNames: { OFFICE: "Award Scholarship", PRINCIPAL: "Award Scholarship" } },
  { href: "/office/scholarship/students", roleNames: { OFFICE: "Student Scholarships", PRINCIPAL: "Student Scholarships" } },
  { href: "/office/scholarship/reports", roleNames: { OFFICE: "Monthly Reports", PRINCIPAL: "Monthly Reports" } },
  { href: "/office/scholarship/settings", roleNames: { OFFICE: "Criteria Settings", PRINCIPAL: "Criteria Settings" } },
  { href: "/student/scholarship", roleNames: { STUDENT_PARENT: "My Scholarship" } },
  { href: "/teacher/scholarship-criteria", roleNames: { TEACHER: "PTM & Guardian Ratings" } },

  // Academy Management Category
  { type: "section", name: "Academy Management" },
  { href: "/office/academy-management/attendance", roleNames: { OFFICE: "Attendance Management", PRINCIPAL: "Attendance Management", TEACHER: "Attendance" } },
  { href: "/office/academy-management/classes", roleNames: { OFFICE: "Class Management", PRINCIPAL: "Class Management", TEACHER: "My Classes" } },
  { href: "/office/academy-management/lesson-plan", roleNames: { OFFICE: "Lesson Plan Management", PRINCIPAL: "Lesson Plan Management", TEACHER: "Lesson Plans" } },
  { href: "/office/academy-management/lesson-plan/review", roleNames: { OFFICE: "Lesson Plan Review", PRINCIPAL: "Lesson Plan Review", TEACHER: "Review Lesson Plans" } },
  { href: "/office/academy-management/homework", roleNames: { OFFICE: "Homework Management", PRINCIPAL: "Homework Management", TEACHER: "My Homework Review" } },
  { href: "/office/academy-management/exams", roleNames: { OFFICE: "Test & Exam Management", PRINCIPAL: "Test & Exam Management" } },
  { href: "/student/homework", roleNames: { STUDENT_PARENT: "My Homework" } },
  { href: "/student/attendance", roleNames: { STUDENT_PARENT: "My Attendance" } },

  // Time Table Management Category
  { type: "section", name: "Time Table Management" },
  { href: "/office/timetable", roleNames: { OFFICE: "Manage Timetable", PRINCIPAL: "Manage Timetable" } },

  // Leave Management Category
  { type: "section", name: "Leave Management" },
  { href: "/office/academy-management/leaves", roleNames: { OFFICE: "Student Leaves", PRINCIPAL: "Student Leaves" } },
  { href: "/office/leaver-management/tc", roleNames: { OFFICE: "TC Generation", PRINCIPAL: "TC Generation" } },
  { href: "/student/leave", roleNames: { STUDENT_PARENT: "Apply Leave" } },

  // Lab, Library & Resource Management Category
  { type: "section", name: "Lab, Library & Resource Management" },
  { href: "/office/academy-management/library", roleNames: { OFFICE: "Library & Resources", PRINCIPAL: "Library & Resources" } },
  { href: "/office/labs", roleNames: { OFFICE: "Labs", PRINCIPAL: "Labs" } },

  // Incident Management Category
  { type: "section", name: "Incident Management" },
  { href: "/office/incident-management", roleNames: { OFFICE: "Manage Incidents", PRINCIPAL: "Manage Incidents" } },
  { href: "/teacher/incident-management", roleNames: { TEACHER: "My Logged Incidents" } },
  { href: "/student/incident-management", roleNames: { STUDENT_PARENT: "My Logged Incidents" } },

  // School Health Program Category
  { type: "section", name: "School Health Program" },
  { href: "/office/school-health/dashboard", roleNames: { OFFICE: "Health Dashboard", PRINCIPAL: "Health Dashboard" } },
  { href: "/office/school-health/records", roleNames: { OFFICE: "Student Health Records", PRINCIPAL: "Student Health Records" } },
  { href: "/office/school-health/daily-check", roleNames: { OFFICE: "Daily Health Check", PRINCIPAL: "Daily Health Check" } },
  { href: "/office/school-health/wellness", roleNames: { OFFICE: "Wellness & Nutrition", PRINCIPAL: "Wellness & Nutrition" } },
  { href: "/office/school-health/settings", roleNames: { OFFICE: "Settings & Committee", PRINCIPAL: "Settings & Committee" } },

  // Transport Management Category
  { type: "section", name: "Transport Management" },
  { href: "/office/transport/students", roleNames: { OFFICE: "Student Transport", PRINCIPAL: "Student Transport" } },

  // People Management Category
  { type: "section", name: "People Management" },
  { href: "/office/admin-management", roleNames: { OFFICE: "Admin Management", PRINCIPAL: "Admin Management" } },
  { href: "/office/school-management/teachers", roleNames: { OFFICE: "Teacher Management", PRINCIPAL: "Teacher Management" } },
  { href: "/office/school-management/principal", roleNames: { OFFICE: "Principal Management", PRINCIPAL: "Principal Management" } },

  // Access Module Category
  { type: "section", name: "Access Module Management" },
  { href: "/office/access-management", roleNames: { OFFICE: "Access UI Management", PRINCIPAL: "Access UI Management" } },

  // Committee Management Category
  { type: "section", name: "Committee Management" },
  { href: "/office/committees", roleNames: { OFFICE: "Manage Committees", PRINCIPAL: "Manage Committees" } },
];

const isDefaultSectionForRole = (role: string, name: string): boolean => {
  if (role === "OFFICE" || role === "PRINCIPAL" || role === "ADMIN") {
    return [
      "Admissions", "Scholarship", "Academy Management", "Leave Management",
      "Lab, Library & Resource Management", "Incident Management", "School Health Program", "Time Table Management",
      "Transport Management", "People Management", "Access Module Management",
      "Committee Management"
    ].includes(name);
  }
  if (role === "TEACHER") {
    return ["Admissions", "Academy Management", "Incident Management", "Scholarship"].includes(name);
  }
  if (role === "STUDENT_PARENT") {
    return ["Admissions", "Scholarship", "Academy Management", "Leave Management", "Incident Management"].includes(name);
  }
  return false;
};

const isDefaultForItem = (role: string, href: string): boolean => {
  if (role === "OFFICE" || role === "PRINCIPAL" || role === "ADMIN") {
    return [
      "/office/dashboard",
      "/office/inquiries",
      "/office/admissions-progress",
      "/office/document-verification",
      "/office/entrance-tests",
      "/office/home-visits",
      "/office/final-admissions",
      "/office/scholarship/award",
      "/office/scholarship/students",
      "/office/scholarship/reports",
      "/office/scholarship/settings",
      "/office/academy-management/attendance",
      "/office/academy-management/classes",
      "/office/academy-management/lesson-plan",
      "/office/academy-management/lesson-plan/review",
      "/office/academy-management/homework",
      "/office/academy-management/exams",
      "/office/academy-management/leaves",
      "/office/academy-management/library",
      "/office/labs",
      "/office/leaver-management/tc",
      "/office/incident-management",
      "/office/school-health/dashboard",
      "/office/school-health/records",
      "/office/school-health/daily-check",
      "/office/school-health/wellness",
      "/office/school-health/settings",
      "/office/timetable",
      "/office/transport/students",
      "/office/admin-management",
      "/office/school-management/teachers",
      "/office/school-management/principal",
      "/office/access-management",
      "/office/committees"
    ].includes(href);
  }
  if (role === "TEACHER") {
    return [
      "/teacher/dashboard",
      "/office/academy-management/classes",
      "/office/academy-management/attendance",
      "/office/academy-management/lesson-plan",
      "/office/academy-management/homework",
      "/office/academy-management/lesson-plan/review",
      "/teacher/incident-management",
      "/office/inquiries",
      "/office/admissions-progress",
      "/office/document-verification",
      "/office/entrance-tests",
      "/office/home-visits",
      "/teacher/scholarship-criteria"
    ].includes(href);
  }
  if (role === "STUDENT_PARENT") {
    return [
      "/student/dashboard",
      "/student/admission",
      "/student/admission?step=10",
      "/student/entrance-test",
      "/student/home-visit",
      "/student/scholarship",
      "/student/incident-management",
      "/student/homework",
      "/student/attendance",
      "/student/leave"
    ].includes(href);
  }
  return false;
};

const getItemName = (item: any, role: string): string => {
  if (item.roleNames && item.roleNames[role]) {
    return item.roleNames[role];
  }
  // Fallback to first available role specific name
  const keys = Object.keys(item.roleNames || {});
  if (keys.length > 0) {
    return item.roleNames[keys[0]];
  }
  return "Unknown Module";
};

export default function AccessManagementClient() {
  const [activeRole, setActiveRole] = useState<string>("TEACHER");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const [permissions, setPermissions] = useState<{
    sections: Record<string, boolean>;
    items: Record<string, boolean>;
  }>({ sections: {}, items: {} });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load classes or direct user list on active role change
  useEffect(() => {
    setSelectedUserId("");
    setUsersList([]);
    setPermissions({ sections: {}, items: {} });
    setFeedback(null);

    if (activeRole === "STUDENT_PARENT") {
      setIsLoading(true);
      fetch("/api/sidebar-permissions/users?role=STUDENT_PARENT")
        .then((res) => res.json())
        .then((data) => {
          if (data.classes) {
            setClassesList(data.classes);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(true);
      fetch(`/api/sidebar-permissions/users?role=${activeRole}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setUsersList(data);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [activeRole]);

  // Load students on class change
  useEffect(() => {
    if (activeRole === "STUDENT_PARENT" && selectedClassId) {
      setIsLoading(true);
      setSelectedUserId("");
      setUsersList([]);
      setPermissions({ sections: {}, items: {} });

      fetch(`/api/sidebar-permissions/users?role=STUDENT_PARENT&classId=${selectedClassId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.students) {
            setUsersList(data.students);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [selectedClassId, activeRole]);

  // Load user custom overrides
  useEffect(() => {
    if (selectedUserId) {
      setIsLoading(true);
      setFeedback(null);
      fetch(`/api/sidebar-permissions?userId=${selectedUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.permissions) {
            setPermissions({
              sections: data.permissions.sections || {},
              items: data.permissions.items || {},
            });
          } else {
            setPermissions({ sections: {}, items: {} });
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    } else {
      setPermissions({ sections: {}, items: {} });
    }
  }, [selectedUserId]);

  const handleToggleSection = (sectionName: string) => {
    setPermissions((prev) => {
      const isDefault = isDefaultSectionForRole(activeRole, sectionName);
      const currentVal = prev.sections[sectionName] !== undefined
        ? prev.sections[sectionName]
        : isDefault;

      const newVal = !currentVal;
      const updatedSections = { ...prev.sections, [sectionName]: newVal };

      // Batch toggle all buttons belonging to this section to match
      const updatedItems = { ...prev.items };
      let activeSection = "";
      MASTER_STRUCTURE.forEach((item) => {
        if (item.type === "section") {
          activeSection = item.name;
        } else if (activeSection === sectionName && item.href) {
          updatedItems[item.href] = newVal;
        }
      });

      return {
        sections: updatedSections,
        items: updatedItems,
      };
    });
  };

  const handleToggleItem = (href: string) => {
    setPermissions((prev) => {
      const isDefault = isDefaultForItem(activeRole, href);
      const currentVal = prev.items[href] !== undefined
        ? prev.items[href]
        : isDefault;
      
      return {
        ...prev,
        items: {
          ...prev.items,
          [href]: !currentVal,
        },
      };
    });
  };

  const handleSave = () => {
    if (!selectedUserId) return;
    setIsSaving(true);
    setFeedback(null);

    fetch("/api/sidebar-permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUserId,
        permissions: permissions,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFeedback({ type: "success", text: "Sidebar configuration persisted in the database successfully!" });
        } else {
          setFeedback({ type: "error", text: data.error || "Failed to save configuration." });
        }
      })
      .catch((err) => {
        console.error(err);
        setFeedback({ type: "error", text: "An error occurred while saving." });
      })
      .finally(() => setIsSaving(false));
  };

  const handleReset = () => {
    if (!window.confirm("Are you sure you want to reset all overrides? This will restore defaults for this user.")) {
      return;
    }
    setPermissions({ sections: {}, items: {} });
    setFeedback(null);

    setIsSaving(true);
    fetch("/api/sidebar-permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUserId,
        permissions: { sections: {}, items: {} },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFeedback({ type: "success", text: "Successfully reset to role-based default sidebar!" });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsSaving(false));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <Lock className="text-slate-600" size={20} />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 leading-none">Sidebar Access & Permission Control</h1>
          <p className="text-xs text-slate-500 mt-1.5">Direct manual interface to grant or remove access to any section or button in the platform.</p>
        </div>
      </div>

      {/* Step 1: Role Selection */}
      <div className="mb-6">
        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
          Step 1: Select User Role
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "TEACHER", label: "Teachers" },
            { id: "PRINCIPAL", label: "Principals" },
            { id: "OFFICE", label: "Office Staff" },
            { id: "ADMIN", label: "Administrators" },
            { id: "STUDENT_PARENT", label: "Students" },
          ].map((roleObj) => (
            <button
              key={roleObj.id}
              onClick={() => setActiveRole(roleObj.id)}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all ${
                activeRole === roleObj.id
                  ? "bg-slate-950 text-white border-slate-950 shadow-md shadow-slate-950/10"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {roleObj.label}
            </button>
          ))}
        </div>
      </div>
 
      {/* Step 2: User Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 border-b border-slate-50 pb-6">
        {activeRole === "STUDENT_PARENT" && (
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Step 2A: Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-slate-400 transition-colors"
            >
              <option value="">-- Choose Class --</option>
              {classesList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        )}
 
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
            {activeRole === "STUDENT_PARENT" ? "Step 2B: Select Student" : "Step 2: Select Specific User"}
          </label>
          <select
            value={selectedUserId}
            disabled={activeRole === "STUDENT_PARENT" && !selectedClassId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-slate-400 transition-colors disabled:opacity-50"
          >
            <option value="">
              {activeRole === "STUDENT_PARENT" && !selectedClassId
                ? "-- Select Class First --"
                : `-- Select ${
                    activeRole === "TEACHER" 
                      ? "Teacher" 
                      : activeRole === "PRINCIPAL" 
                      ? "Principal" 
                      : activeRole === "OFFICE" 
                      ? "Office Staff" 
                      : activeRole === "ADMIN" 
                      ? "Administrator" 
                      : "Student"
                  } --`}
            </option>
            {usersList.map((user, idx) => (
              <option key={user.userId || idx} value={user.userId || ""}>
                {user.name} {user.studentId ? `(${user.studentId})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading bar */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 gap-3 text-slate-500 font-bold text-xs">
          <RefreshCw className="animate-spin" size={16} />
          Loading database configurations...
        </div>
      )}

      {/* Checklist Grid */}
      {!isLoading && selectedUserId && (
        <div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 flex gap-3">
            <AlertCircle className="text-slate-500 flex-shrink-0" size={16} />
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              <strong>Dynamic Module Grid:</strong> Ticked items `[x]` will be visible in the user's sidebar. Unticked `[ ]` items will be completely hidden. You can grant access to **any section in the system** (even those not in their default layout) by checking them below.
            </p>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 mb-6">
            {MASTER_STRUCTURE.map((item, idx) => {
              const isSection = item.type === "section";

              if (isSection) {
                // Section Visibility check
                const isDefaultSec = isDefaultSectionForRole(activeRole, item.name);
                const isChecked = permissions.sections[item.name] !== undefined
                  ? permissions.sections[item.name]
                  : isDefaultSec;

                return (
                  <div key={`sec-${idx}`} className="bg-slate-50/50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        id={`sec-chk-${idx}`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSection(item.name)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <label htmlFor={`sec-chk-${idx}`} className="text-xs font-black uppercase tracking-wider text-slate-800 cursor-pointer select-none">
                        {item.name}
                      </label>
                    </div>
                    <span className="text-[9px] bg-slate-200 text-slate-600 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Section Category
                    </span>
                  </div>
                );
              }

              // Regular Button Item Visibility check
              const isDefaultBtn = isDefaultForItem(activeRole, item.href || "");
              const isChecked = permissions.items[item.href || ""] !== undefined
                ? permissions.items[item.href || ""]
                : isDefaultBtn;

              return (
                <div key={`item-${idx}`} className="px-8 py-3 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      id={`item-chk-${idx}`}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleItem(item.href || "")}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <label htmlFor={`item-chk-${idx}`} className="text-xs font-bold text-slate-600 cursor-pointer select-none hover:text-slate-900 transition-colors">
                      {getItemName(item, activeRole)}
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.href}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-4 rounded-xl border text-xs font-extrabold flex items-center gap-2.5 mb-6 ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {feedback.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
              {feedback.text}
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-slate-950 text-white font-extrabold text-xs px-5 py-3 rounded-xl hover:bg-slate-900 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Custom Overrides"}
            </button>
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="bg-white text-rose-600 font-extrabold text-xs px-5 py-3 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 transition-all disabled:opacity-50"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {!selectedUserId && !isLoading && (
        <div className="border border-dashed border-slate-200 rounded-2xl py-12 px-6 text-center text-slate-400 font-medium text-xs mt-4">
          Please select a specific user from Step 2 to configure sidebar navigation permissions.
        </div>
      )}
    </div>
  );
}
