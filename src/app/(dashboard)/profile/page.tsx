"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Camera, Mail, User, Phone, MapPin, AlignLeft, Loader2, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { StudentProfileDashboard } from "./components/StudentProfileDashboard";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    bio: "",
  });

  const userEmail = session?.user?.email || "demo-fellow@gmail.com";
  const isStudent = session?.user?.role === "STUDENT_PARENT";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetch("/api/profile/update")
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            setFormData({
              name: data.profile.name || session.user?.name || "",
              phone: data.profile.phone || "",
              location: data.profile.location || "",
              bio: data.profile.bio || "",
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [status, router, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
        }, 2000);
      } else {
        const errorData = await res.json();
        alert("Error saving: " + (errorData.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className={`${isStudent ? 'max-w-6xl' : 'max-w-3xl'} mx-auto space-y-6`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{isStudent ? "Profile View" : "Update your profile information"}</h1>
        </div>

        {isStudent ? (
          <StudentProfileDashboard />
        ) : (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Profile Information</h2>
            <p className="text-sm text-slate-500 mb-6">Update your personal details and profile picture</p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border-2 border-slate-200 border-dashed hover:bg-slate-200 transition-colors cursor-pointer">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-bold text-sm rounded-xl">
                      Choose File
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1">JPG, PNG or GIF (max 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" /> Email Address
                  </label>
                  <input 
                    type="email" 
                    disabled 
                    value={userEmail}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <User className="h-3.5 w-3.5" /> Full Name
                  </label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> Phone Number
                  </label>
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Location
                  </label>
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter your location"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                  <AlignLeft className="h-3.5 w-3.5" /> Bio
                </label>
                <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Write a short bio about yourself..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                ></textarea>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button 
                  id="save-btn"
                  onClick={handleSave}
                  disabled={saving || saveSuccess}
                  className={`flex items-center gap-2 px-6 py-2.5 ${
                    saveSuccess 
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-600 shadow-green-500/20' 
                      : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-blue-500/20'
                  } text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95`}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
