import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <div className="absolute inset-0 bg-blue-600/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Data...</p>
      </div>
    </div>
  );
}
