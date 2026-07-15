"use client";

import React, { useState, useEffect } from 'react';
import { User, Phone, BookOpen, Users, Key, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { ProfileTabs } from './ProfileTabs';

export function StudentProfileDashboard() {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/profile/student-data')
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
        Failed to load student data.
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic', icon: User },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'guardian', label: 'Guardian', icon: Users },
    { id: 'sibling', label: 'Sibling', icon: Users },
    { id: 'academy', label: 'Academy', icon: BookOpen },
  ];

  const studentName = data.bio 
    ? `${data.bio.firstName} ${data.bio.lastName}`
    : 'Unknown Student';
    
  const className = data.academyData?.className || data.admission?.academicYear || 'Not Enrolled';

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Profile Header */}
        <div className="p-6 flex flex-col items-center justify-center border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white text-center">
          <div className="h-24 w-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-black mb-4 overflow-hidden border-4 border-white shadow-sm">
            {data.user?.profilePictureUrl ? (
              <img src={data.user.profilePictureUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              studentName.charAt(0)
            )}
          </div>
          <h2 className="text-lg font-black text-slate-900">{studentName}</h2>
          <p className="text-sm font-bold text-slate-500 mt-1">{className}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
            <span>{data.admission?.scholarNumber || data.admission?.entryNumber}</span>
          </div>
          {data.user?.phone && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 font-medium">
              <Phone className="h-3.5 w-3.5" />
              {data.user.phone}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col p-2 gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between w-full p-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-bold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {tab.label}
                </div>
                <ChevronRight className={`h-4 w-4 ${isActive ? 'opacity-100 text-blue-400' : 'opacity-0'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 w-full">
        <ProfileTabs activeTab={activeTab} data={data} />
      </div>
    </div>
  );
}
