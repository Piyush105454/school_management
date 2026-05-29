"use client";

import React, { useState, useEffect, useRef } from "react";
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

  // Home pinning vector grid states
  const [pinnedLat, setPinnedLat] = useState<number | null>(assignment?.latitude || null);
  const [pinnedLng, setPinnedLng] = useState<number | null>(assignment?.longitude || null);
  const [pinnedAddress, setPinnedAddress] = useState<string>(assignment?.locationName || "");

  // Real-time animation states for live tracking simulation
  const [busPosition, setBusPosition] = useState<{ x: number; y: number } | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (bus && localAssignment) {
      setTrackingActive(true);
    }
  }, [bus, localAssignment]);

  // Handle live tracking simulation loop on canvas
  useEffect(() => {
    if (!trackingActive || !canvasRef.current || !bus) return;
    
    let stops: any[] = [];
    try {
      stops = typeof bus.routes === "string" ? JSON.parse(bus.routes) : bus.routes || [];
    } catch (e) {
      stops = [];
    }

    if (stops.length < 2) return;

    let stopIndex = 0;
    let progress = 0;
    let animationFrameId: number;

    const toCanvasCoords = (lat: number, lng: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const cx = canvas.width / 2 + (lng - CENTER_LNG) * MAP_SCALE;
      const cy = canvas.height / 2 - (lat - CENTER_LAT) * MAP_SCALE;
      return { x: cx, y: cy };
    };

    const animateBus = () => {
      const currentStop = stops[stopIndex];
      const nextStop = stops[(stopIndex + 1) % stops.length];

      const currentCoords = toCanvasCoords(currentStop.lat || CENTER_LAT, currentStop.lng || CENTER_LNG);
      const nextCoords = toCanvasCoords(nextStop.lat || CENTER_LAT, nextStop.lng || CENTER_LNG);

      // Interpolate bus position
      const bx = currentCoords.x + (nextCoords.x - currentCoords.x) * progress;
      const by = currentCoords.y + (nextCoords.y - currentCoords.y) * progress;

      setBusPosition({ x: bx, y: by });

      progress += 0.005; // move slowly
      if (progress >= 1.0) {
        progress = 0;
        stopIndex = (stopIndex + 1) % stops.length;
      }

      // Draw map overlay
      drawStaticMapElements(stops);

      animationFrameId = requestAnimationFrame(animateBus);
    };

    animateBus();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [trackingActive, pinnedLat, pinnedLng]);

  const drawStaticMapElements = (stops: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0f172a"; // background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tech grids
    ctx.strokeStyle = "rgba(51, 65, 85, 0.15)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const toCanvasCoords = (lat: number, lng: number) => {
      const cx = canvas.width / 2 + (lng - CENTER_LNG) * MAP_SCALE;
      const cy = canvas.height / 2 - (lat - CENTER_LAT) * MAP_SCALE;
      return { x: cx, y: cy };
    };

    // Plot route path line
    ctx.beginPath();
    ctx.strokeStyle = "#db2777";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#db2777";
    ctx.shadowBlur = 10;
    stops.forEach((stop, index) => {
      const coords = toCanvasCoords(stop.lat || CENTER_LAT, stop.lng || CENTER_LNG);
      if (index === 0) ctx.moveTo(coords.x, coords.y);
      else ctx.lineTo(coords.x, coords.y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Plot student home pin
    if (pinnedLat && pinnedLng) {
      const coords = toCanvasCoords(pinnedLat, pinnedLng);

      // Dash connection to pickup stop
      const assignedStop = stops.find(s => s.name === localAssignment.routeStop);
      if (assignedStop) {
        const stopCoords = toCanvasCoords(assignedStop.lat || CENTER_LAT, assignedStop.lng || CENTER_LNG);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.setLineDash([4, 4]);
        ctx.moveTo(coords.x, coords.y);
        ctx.lineTo(stopCoords.x, stopCoords.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.arc(coords.x, coords.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981"; // emerald home pin
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText("My Home", coords.x + 10, coords.y + 3);
    }

    // Draw Stops
    stops.forEach((stop, index) => {
      const coords = toCanvasCoords(stop.lat || CENTER_LAT, stop.lng || CENTER_LNG);
      const isSchool = index === 0;

      ctx.beginPath();
      ctx.arc(coords.x, coords.y, isSchool ? 12 : 7, 0, Math.PI * 2);
      ctx.fillStyle = isSchool ? "#3b82f6" : "#db2777";
      ctx.fill();

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText(stop.name, coords.x + 10, coords.y + 2);
    });

    // Draw Live Bus position dot
    if (busPosition) {
      ctx.beginPath();
      ctx.arc(busPosition.x, busPosition.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b"; // amber for moving school bus
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(busPosition.x, busPosition.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
      ctx.stroke();
    }
  };

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
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden select-none min-h-[420px] flex flex-col justify-between text-white">
          
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5 text-slate-200">
                <Map size={16} className="text-pink-500" />
                Live Transit Tracker Map
              </h3>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Simulated real-time bus positioning</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 text-[8px] font-black tracking-widest text-amber-400 uppercase shadow-xl animate-pulse">
              <Compass size={10} className="animate-spin" />
              Live Bus GPS Active
            </div>
          </div>

          {/* Tracker Canvas */}
          <div className="my-4 flex items-center justify-center relative">
            <canvas
              ref={canvasRef}
              width={420}
              height={260}
              className="rounded-2xl max-w-full bg-slate-950 border border-slate-800 shadow-inner cursor-pointer"
              onClick={handleManualMapPin}
            />
          </div>

          {/* Operator contact details */}
          <div className="p-4 bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-2xl flex items-center justify-between gap-4 relative z-10 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-700 text-slate-200 rounded-xl flex items-center justify-center">
                <ShieldAlert size={20} />
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bus Driver / Operator</p>
                <p className="text-xs font-black text-slate-200 mt-0.5">Virendra Singh</p>
              </div>
            </div>
            <a href="tel:+919876543210" className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-950 rounded-xl border border-slate-700 text-[10px] font-black uppercase tracking-wider text-pink-400 hover:text-white transition-colors">
              <Phone size={12} />
              Call Driver
            </a>
          </div>

        </div>
      </div>

    </div>
  );
}
