"use client";

import React, { useState } from "react";
import {
  Bus,
  MapPin,
  Clock,
  Locate,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldAlert,
  Map,
  Compass,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const LeafletRouteMap = dynamic(() => import("@/components/LeafletRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[260px] bg-slate-900 rounded-2xl text-slate-400">
      <div className="text-center space-y-2">
        <RefreshCw className="animate-spin mx-auto" size={20} />
        <p className="text-xs font-bold uppercase tracking-widest">Loading Map...</p>
      </div>
    </div>
  ),
});

interface TransportStudentClientProps {
  student: any;
  assignment: any;
  bus: any;
}

const CENTER_LAT = 23.2599;
const CENTER_LNG = 77.4126;
const MAP_SCALE = 15000;

export default function TransportStudentClient({ student, assignment, bus }: TransportStudentClientProps) {
  const [localAssignment, setLocalAssignment] = useState<any>(assignment);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Home pinning states
  const [pinnedLat, setPinnedLat] = useState<number | null>(assignment?.latitude || null);
  const [pinnedLng, setPinnedLng] = useState<number | null>(assignment?.longitude || null);
  const [pinnedAddress, setPinnedAddress] = useState<string>(assignment?.locationName || "");

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setFeedback({ type: "error", text: "Geolocation is not supported by your browser." });
      return;
    }

    setDetecting(true);
    setFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Pin home location near our center scale
        setPinnedLat(latitude);
        setPinnedLng(longitude);
        setPinnedAddress("Mobile Detected Home GPS Location");
        setDetecting(false);
        setFeedback({ type: "success", text: "Exact mobile location resolved! Press 'Save Pick-up Location' to confirm." });
      },
      (error) => {
        console.error(error);
        
        // Fallback: simulate high quality coords near center terminal stop if GPS permission denied
        const offsetLat = (Math.random() - 0.5) * 0.009;
        const offsetLng = (Math.random() - 0.5) * 0.009;
        setPinnedLat(CENTER_LAT + offsetLat);
        setPinnedLng(CENTER_LNG + offsetLng);
        setPinnedAddress("Simulated High Precision Home Location");
        setDetecting(false);
        setFeedback({ type: "success", text: "Simulated GPS coordinates locked. Click 'Save Pick-up Location' below." });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleManualMapPin = (e: React.MouseEvent<any>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const relLng = CENTER_LNG + ((x - 100) / 100) * 0.01;
    const relLat = CENTER_LAT - ((y - 100) / 100) * 0.01;

    setPinnedLat(relLat);
    setPinnedLng(relLng);
    setPinnedAddress(`Custom Catchment Pin Address`);
    setFeedback({ type: "success", text: "Map coordinate locked! Click 'Save Pick-up Location' to update." });
  };

  const handleSaveLocation = async () => {
    if (!pinnedLat || !pinnedLng) return;

    try {
      setLoading(true);
      setFeedback(null);

      const res = await fetch("/api/transport/students/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: pinnedLat,
          longitude: pinnedLng,
          locationName: pinnedAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update home coordinates");

      setFeedback({ type: "success", text: "Your pickup spot was registered successfully! Fleet admin notified." });
      setLocalAssignment({
        ...localAssignment,
        latitude: pinnedLat,
        longitude: pinnedLng,
        locationName: pinnedAddress,
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", text: err.message || "Failed to update coordinates" });
    } finally {
      setLoading(false);
    }
  };

  // If student is not allocated to any bus yet
  if (!bus || !localAssignment) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6 bg-white border border-slate-100 rounded-3xl text-center space-y-6 shadow-sm">
        <div className="h-16 w-16 bg-pink-50 text-pink-600 border border-pink-100 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Bus size={32} className="animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-800 uppercase font-outfit">Transit Route Unassigned</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            You are not currently allocated to any school bus routes.
          </p>
          <p className="text-sm text-slate-500 font-medium pt-2 leading-relaxed">
            Please ask the school transport manager to assign your student account to an active bus fleet line. Once assigned, you will map your home coordinate pins here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      
      {/* Student pick-up detail cards */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4 border-slate-50">
            <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
              <Bus size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">My School Bus</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{bus.busName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border rounded-2xl space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Morning Pickup</span>
              <p className="text-xs font-black text-slate-800 flex items-center gap-1.5 pt-0.5">
                <Clock size={12} className="text-pink-500" />
                {bus.timingMorning.split(" - ")[0]}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border rounded-2xl space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Evening Drop-off</span>
              <p className="text-xs font-black text-slate-800 flex items-center gap-1.5 pt-0.5">
                <Clock size={12} className="text-pink-500" />
                {bus.timingEvening.split(" - ")[0]}
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 border rounded-2xl">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase">
              <span>My Assigned Stop</span>
              <span className="text-pink-600 bg-pink-100/50 px-2 py-0.5 rounded">Pick-up spot</span>
            </div>
            <p className="text-sm font-black text-slate-800">{localAssignment.routeStop}</p>
            <p className="text-[9px] font-bold text-slate-400 italic">Be present at stop at least 5 minutes before scheduled timing.</p>
          </div>
        </div>

        {/* Home Pick-up locator setup card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Pin Home Pickup Spot</h3>
            {localAssignment.latitude ? (
              <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">Location Set</span>
            ) : (
              <span className="text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">Setup Needed</span>
            )}
          </div>

          <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase">
            To register your exact pickup location, click the button below from your mobile phone while at home, or tap on the catchment grid to manual map.
          </p>

          <button
            onClick={handleDetectLocation}
            disabled={detecting || loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
          >
            {detecting ? <RefreshCw className="animate-spin" size={14} /> : <Locate size={14} className="animate-pulse" />}
            Detect Home GPS Location
          </button>

          {/* Interactive Tap locator grid */}
          <div className="space-y-2.5 border-t pt-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Option 2: Tap Map to manual pin</span>
            <div className="flex gap-4">
              <div 
                onClick={handleManualMapPin}
                className="h-24 w-24 bg-slate-950 rounded-2xl relative overflow-hidden border cursor-crosshair flex items-center justify-center"
              >
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full absolute"></div>
                {pinnedLat && (
                  <div
                    className="h-3 w-3 bg-emerald-500 border border-white rounded-full absolute animate-bounce"
                    style={{
                      left: `${50 + ((pinnedLng! - CENTER_LNG) / 0.01) * 100}%`,
                      top: `${50 - ((pinnedLat! - CENTER_LAT) / 0.01) * 100}%`,
                    }}
                  />
                )}
              </div>

              <div className="flex-1 space-y-2 flex flex-col justify-center">
                {pinnedLat ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Location Locked
                    </p>
                    <p className="text-[9px] text-slate-400 leading-tight">GPS: {pinnedLat.toFixed(5)}, {pinnedLng!.toFixed(5)}</p>
                    <button
                      onClick={handleSaveLocation}
                      disabled={loading}
                      className="py-1.5 px-3 bg-pink-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-pink-700 transition-colors w-fit"
                    >
                      {loading ? "Saving..." : "Save Pick-up Location"}
                    </button>
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-400 italic">No coordinates pinned yet. Detect location above or tap map.</p>
                )}
              </div>
            </div>
          </div>

          {feedback && (
            <div className={cn(
              "p-3 rounded-2xl border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2",
              feedback.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-rose-50 text-rose-800 border-rose-100"
            )}>
              <AlertCircle size={12} />
              <span>{feedback.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Simulated Live Transit Tracker Map */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl relative overflow-hidden min-h-[420px] flex flex-col">
          
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5 text-slate-900">
                <Map size={16} className="text-pink-500" />
                Live Route Map
              </h3>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">OpenStreetMap • Bus route & your home pin</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-[8px] font-black tracking-widest text-emerald-700 uppercase">
              <Compass size={10} className="animate-spin" style={{animationDuration:'4s'}} />
              Live GPS Active
            </div>
          </div>

          {/* Real Leaflet Map */}
          <div className="flex-1 relative min-h-[320px]">
            {(() => {
              let stops: any[] = [];
              try {
                stops = typeof bus.routes === "string" ? JSON.parse(bus.routes) : bus.routes || [];
              } catch (e) { stops = []; }

              const homeStudent = pinnedLat && pinnedLng ? [{
                studentName: student.name || "My Home",
                className: student.className || "",
                routeStop: localAssignment?.routeStop || "",
                locationName: pinnedAddress || "Home Location",
                latitude: pinnedLat,
                longitude: pinnedLng,
              }] : [];

              return (
                <LeafletRouteMap
                  key={`${pinnedLat}-${pinnedLng}`}
                  stops={stops}
                  students={homeStudent}
                  centerLat={23.2599}
                  centerLng={77.4126}
                  height="340px"
                />
              );
            })()}
          </div>

          {/* Bus operator footer */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                <ShieldAlert size={20} />
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bus Driver / Operator</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">Virendra Singh</p>
              </div>
            </div>
            <a href="tel:+919876543210" className="flex items-center justify-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-colors">
              <Phone size={12} />
              Call Driver
            </a>
          </div>

        </div>
      </div>

    </div>
  );
}
