import type { Metadata } from "next";
import { ArrowRight, Globe, Lock, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Application Moved | SchoolFlow",
  description: "The school management platform has been moved to our official domain.",
};

export default function MovedNoticePage() {
  const newDomain = "https://dps.wazireducationsociety.org/office/dashboard";

  return (
    <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black flex items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-xl w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10 text-center space-y-8">
        {/* Header Icon */}
        <div className="mx-auto w-20 h-20 bg-linear-to-b from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-inner relative group">
          <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Globe className="w-10 h-10 text-blue-400 animate-pulse" />
        </div>

        {/* Text Section */}
        <div className="space-y-3">
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest inline-block">
            System Migration Notice
          </span>
          <h1 id="migration-title" className="text-3xl md:text-4xl font-black tracking-tight bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent capitalize">
            We Have Moved!
          </h1>
          <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-md mx-auto">
            Our school management application has migrated from this Vercel address to our official high-performance server.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-6 text-left space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Secure Production Environment</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                This URL is no longer used for production or staging. All updates are now pushed directly to AWS.
              </p>
            </div>
          </div>
          <div className="h-px bg-slate-800/40 w-full" />
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Data Integrity</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Using this old Vercel URL may lead to outdated databases. Please use the official site below.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-4 pt-2">
          <a
            id="btn-go-to-new-site"
            href={newDomain}
            className="w-full py-4 px-6 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-sm font-black uppercase tracking-widest rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group cursor-pointer text-center"
          >
            Go to Main Application
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
          <p className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">
            Official URL: <span className="text-slate-400">dps.wazireducationsociety.org</span>
          </p>
        </div>
      </div>
    </div>
  );
}
