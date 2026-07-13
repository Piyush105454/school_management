import React from "react";
import { Lock, Key } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h1>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Key className="h-8 w-8" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Change Your Password</h2>
          <p className="text-sm text-slate-500 mb-8 text-center">Secure your account by updating your password.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">New Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm font-medium text-slate-700 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Confirm New Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm font-medium text-slate-700 outline-none transition-all"
              />
            </div>
            
            <div className="pt-4">
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-blue-500/20 active:scale-95">
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
