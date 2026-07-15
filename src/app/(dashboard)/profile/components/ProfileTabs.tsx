import React from 'react';

export function ProfileTabs({ activeTab, data }: { activeTab: string, data: any }) {
  if (!data) return null;

  const { user, admission, bio, address, parents, siblings, academic, academyData } = data;

  const InfoRow = ({ label, value }: { label: string, value: any }) => (
    <div className="flex flex-col space-y-1">
      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value || '-'}</span>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-900 capitalize">{activeTab} Information</h2>
        <p className="text-sm text-slate-500 mt-1">View your {activeTab.toLowerCase()} details securely.</p>
      </div>
      
      <div className="p-6">
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
            <InfoRow label="Registration Number" value={admission?.entryNumber} />
            <InfoRow label="Scholar Number" value={admission?.scholarNumber} />
            <InfoRow label="Academic Year" value={admission?.academicYear} />
            
            <InfoRow label="First Name" value={bio?.firstName} />
            <InfoRow label="Middle Name" value={bio?.middleName} />
            <InfoRow label="Last Name" value={bio?.lastName} />
            
            <InfoRow label="Birth Date" value={bio?.dob ? new Date(bio.dob).toLocaleDateString() : ''} />
            <InfoRow label="Age" value={bio?.age} />
            <InfoRow label="Gender" value={bio?.gender === 'M' ? 'Male' : bio?.gender === 'F' ? 'Female' : 'Other'} />
            
            <InfoRow label="Religion" value={bio?.religion} />
            <InfoRow label="Caste" value={bio?.caste} />
            <InfoRow label="Blood Group" value={bio?.bloodGroup} />
            
            <InfoRow label="Aadhaar Number" value={bio?.aadhaarNumber} />
            <InfoRow label="Samagra ID" value={bio?.samagraId} />
            <InfoRow label="Status" value={admission?.status} />
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
            <InfoRow label="Email Address" value={user?.email} />
            <InfoRow label="Primary Phone" value={user?.phone} />
            
            <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-md font-bold text-slate-800 mb-4">Residential Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
                <InfoRow label="House No." value={address?.houseNo} />
                <InfoRow label="Street" value={address?.street} />
                <InfoRow label="Village/Area" value={address?.village} />
                <InfoRow label="Ward No." value={address?.wardNo} />
                <InfoRow label="Tehsil" value={address?.tehsil} />
                <InfoRow label="District" value={address?.district} />
                <InfoRow label="State" value={address?.state} />
                <InfoRow label="PIN Code" value={address?.pinCode} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guardian' && (
          <div className="space-y-8">
            {parents && parents.length > 0 ? (
              parents.map((parent: any, index: number) => (
                <div key={index} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                  <h3 className="text-md font-bold text-slate-800 mb-4 capitalize">{parent.personType.replace('_', ' ')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
                    <InfoRow label="Name" value={parent.name} />
                    <InfoRow label="Mobile Number" value={parent.mobileNumber} />
                    <InfoRow label="Occupation" value={parent.occupation} />
                    <InfoRow label="Qualification" value={parent.qualification} />
                    <InfoRow label="Aadhaar Number" value={parent.aadhaarNumber} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic">No guardian details available.</p>
            )}
          </div>
        )}

        {activeTab === 'sibling' && (
          <div>
            {siblings && siblings.length > 0 ? (
              <div className="space-y-6">
                {siblings.map((sibling: any, index: number) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <InfoRow label="Name" value={sibling.name} />
                      <InfoRow label="Age" value={sibling.age} />
                      <InfoRow label="Gender" value={sibling.gender} />
                      <InfoRow label="Current Class" value={sibling.classCurrent} />
                      <InfoRow label="School Name" value={sibling.schoolName} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">No sibling details available.</p>
            )}
          </div>
        )}

        {activeTab === 'academy' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
            <InfoRow label="Institute" value={academyData?.institute} />
            <InfoRow label="Current Class" value={academyData?.className} />
            <InfoRow label="Roll Number" value={academyData?.rollNumber} />
            <InfoRow label="Student ID" value={academyData?.studentId} />
            <InfoRow label="Scholar Number" value={academyData?.scholarNumber} />
          </div>
        )}
      </div>
    </div>
  );
}
