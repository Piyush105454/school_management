"use client";

import React, { useState, useEffect } from "react";
import {
  Bus,
  MapPin,
  Map,
  UserPlus,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  X,
  Locate,
  Navigation,
  RefreshCw,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamically import Leaflet map to avoid SSR errors (window is not defined)
const LeafletRouteMap = dynamic(() => import("@/components/LeafletRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[460px] text-slate-400">
      <div className="text-center space-y-3">
        <RefreshCw className="animate-spin mx-auto" size={24} />
        <p className="text-xs font-bold uppercase tracking-widest">Loading real map...</p>
      </div>
    </div>
  ),
});

// Center of the school catchment area (Bhopal coordinates)
const CENTER_LAT = 23.2599;
const CENTER_LNG = 77.4126;
const MAP_SCALE = 15000; // pixels per degree

export default function TransportClient() {
  const [activeTab, setActiveTab] = useState<"overview" | "buses" | "students" | "map">("overview");
  const [buses, setBuses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Forms states
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [busName, setBusName] = useState("");
  const [timingMorning, setTimingMorning] = useState("07:15 AM - 08:00 AM");
  const [timingEvening, setTimingEvening] = useState("02:30 PM - 03:15 PM");
  const [capacity, setCapacity] = useState("40");
  const [busStops, setBusStops] = useState<{ name: string; time: string; lat: number; lng: number }[]>([
    { name: "Main School Terminal", time: "07:15 AM", lat: CENTER_LAT, lng: CENTER_LNG }
  ]);
  const [newStopName, setNewStopName] = useState("");
  const [newStopTime, setNewStopTime] = useState("07:20 AM");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedBusId, setSelectedBusId] = useState("");
  const [selectedStopName, setSelectedStopName] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [manualLat, setManualLat] = useState<number | null>(null);
  const [manualLng, setManualLng] = useState<number | null>(null);

  // Visual Map tab states
  const [selectedMapBusId, setSelectedMapBusId] = useState<string>("");
  const [hoveredEntity, setHoveredEntity] = useState<any | null>(null);

  useEffect(() => {
    fetchTransportData();
  }, []);

  const fetchTransportData = async () => {
    try {
      setLoading(true);
      const [resBuses, resStudents] = await Promise.all([
        fetch("/api/transport/buses"),
        fetch("/api/transport/students"),
      ]);

      const dataBuses = await resBuses.json();
      const dataStudents = await resStudents.json();

      if (!resBuses.ok || !resStudents.ok) {
        throw new Error(dataBuses.error || dataStudents.error || "Failed to load transit data");
      }

      setBuses(dataBuses.buses || []);
      setAssignments(dataStudents.assignments || []);
      setUnassignedStudents(dataStudents.unassigned || []);

      if (dataBuses.buses?.length > 0 && !selectedMapBusId) {
        setSelectedMapBusId(String(dataBuses.buses[0].id));
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", text: err.message || "Failed to sync transport records" });
    } finally {
      setLoading(false);
    }
  };




  const handleAddStop = () => {
    if (!newStopName) return;
    
    // Simulate coordinates spread around center
    const randomOffsetLat = (Math.random() - 0.5) * 0.015;
    const randomOffsetLng = (Math.random() - 0.5) * 0.015;
    
    const stopPayload = {
      name: newStopName,
      time: newStopTime,
      lat: CENTER_LAT + randomOffsetLat,
      lng: CENTER_LNG + randomOffsetLng,
    };

    setBusStops([...busStops, stopPayload]);
    setNewStopName("");
    setNewStopTime("07:20 AM");
  };

  const handleCreateBus = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      const res = await fetch("/api/transport/buses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          busName,
          timingMorning,
          timingEvening,
          capacity: parseInt(capacity) || 40,
          routes: busStops,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create bus");

      setFeedback({ type: "success", text: "Fleet vehicle added successfully!" });
      setShowAddBusModal(false);
      setBusName("");
      setBusStops([{ name: "Main School Terminal", time: "07:15 AM", lat: CENTER_LAT, lng: CENTER_LNG }]);
      fetchTransportData();
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", text: err.message || "Failed to create fleet bus" });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignStudent = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      const payload: any = {
        studentId: selectedStudentId,
        busId: selectedBusId,
        routeStop: selectedStopName,
      };

      if (manualLat && manualLng) {
        payload.latitude = manualLat;
        payload.longitude = manualLng;
        payload.locationName = studentAddress || "Assigned Custom Location";
      }

      const res = await fetch("/api/transport/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign student");

      setFeedback({ type: "success", text: "Student assigned to transport successfully!" });
      setShowAssignModal(false);
      setSelectedStudentId("");
      setSelectedBusId("");
      setSelectedStopName("");
      setStudentAddress("");
      setManualLat(null);
      setManualLng(null);
      fetchTransportData();
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", text: err.message || "Failed to assign student" });
    } finally {
      setSaving(false);
    }
  };

  const handleGridMapPinClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Simulate coordinates based on relative position inside the 200x200 pinbox
    const relLng = CENTER_LNG + ((x - 100) / 100) * 0.01;
    const relLat = CENTER_LAT - ((y - 100) / 100) * 0.01;

    setManualLat(relLat);
    setManualLng(relLng);
    if (!studentAddress) {
      setStudentAddress(`Sector ${Math.floor(x/15)} Home Stop`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight flex items-center gap-2">
            <Bus className="text-pink-600 animate-pulse" size={28} />
            Transport & Fleet Workspace
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Manage school buses, configure route stops, and map student locations.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddBusModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            <Plus size={14} />
            Add Fleet Bus
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-pink-500/10 active:scale-95"
          >
            <UserPlus size={14} />
            Assign Student
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner max-w-xl">
        {[
          { key: "overview", label: "Fleet Stats", icon: Compass },
          { key: "buses", label: "Fleet Vehicles", icon: Bus },
          { key: "students", label: "Assigned Students", icon: Users },
          { key: "map", label: "Live Route Map", icon: Map },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              "flex-1 py-2 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5",
              activeTab === tab.key
                ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={cn(
          "p-4 rounded-2xl border flex items-center gap-3 animate-in zoom-in-95 duration-200",
          feedback.type === "success" 
            ? "bg-emerald-50 border-emerald-200/60 text-emerald-800" 
            : "bg-rose-50 border-rose-200/60 text-rose-800"
        )}>
          <AlertCircle size={18} />
          <span className="text-xs font-bold uppercase tracking-wide">{feedback.text}</span>
        </div>
      )}

      {/* Loading Roster */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
          <RefreshCw className="animate-spin text-pink-600" size={24} />
          Synchronizing Fleet records...
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          
          {/* TAB 1: OVERVIEW STATISTICS */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: "Total Fleet Buses", val: buses.length, color: "text-blue-600", bg: "bg-blue-50" },
                { title: "Assigned Students", val: assignments.length, color: "text-emerald-600", bg: "bg-emerald-50" },
                { title: "Awaiting Mobile Setup", val: assignments.filter(a => !a.latitude).length, color: "text-amber-600", bg: "bg-amber-50" },
                { title: "Unassigned Students", val: unassignedStudents.length, color: "text-pink-600", bg: "bg-pink-50" },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn("px-3.5 py-2 rounded-2xl font-black text-2xl", stat.bg, stat.color)}>{stat.val}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.title}</h4>
                </div>
              ))}

              {/* Roster overview panel */}
              <div className="md:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Navigation size={16} className="text-pink-600" />
                  Active Fleet Operations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {buses.map((bus) => {
                    const assignedCount = assignments.filter(a => a.busId === bus.id).length;
                    const fillPct = Math.min(100, Math.round((assignedCount / bus.capacity) * 100));
                    return (
                      <div key={bus.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-150 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-900">{bus.busName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Morning: {bus.timingMorning} • Capacity: {bus.capacity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800">{assignedCount} / {bus.capacity} seats</p>
                          <div className="w-24 bg-slate-200 rounded-full h-2 mt-1.5 overflow-hidden">
                            <div className="bg-pink-600 h-full rounded-full" style={{ width: `${fillPct}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUSES FLEET */}
          {activeTab === "buses" && (
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                    <th className="p-4">Vehicle Name / ID</th>
                    <th className="p-4">Morning Pickup</th>
                    <th className="p-4">Evening Drop-off</th>
                    <th className="p-4 text-center">Seat Capacity</th>
                    <th className="p-4">Stops Along Route</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                  {buses.map((bus) => {
                    let stops: any[] = [];
                    try {
                      stops = typeof bus.routes === "string" ? JSON.parse(bus.routes) : bus.routes || [];
                    } catch (e) {
                      stops = [];
                    }
                    return (
                      <tr key={bus.id} className="hover:bg-slate-50/40">
                        <td className="p-4 font-black text-slate-900">{bus.busName}</td>
                        <td className="p-4">{bus.timingMorning}</td>
                        <td className="p-4">{bus.timingEvening}</td>
                        <td className="p-4 text-center">{bus.capacity} seats</td>
                        <td className="p-4 text-slate-500 font-medium">
                          {stops.length > 0 ? stops.map(s => s.name).join(" → ") : "No stops added"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: ASSIGNED STUDENTS LIST */}
          {activeTab === "students" && (
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Vehicle Route</th>
                    <th className="p-4">Assigned Stop</th>
                    <th className="p-4">Pickup Address</th>
                    <th className="p-4 text-center">GPS Coordinates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-slate-50/40">
                      <td className="p-4 font-black text-slate-900">{assignment.studentName}</td>
                      <td className="p-4 font-medium uppercase tracking-wider text-[10px] bg-slate-50 px-2 py-0.5 rounded-lg border w-fit">{assignment.className}</td>
                      <td className="p-4">{assignment.busName}</td>
                      <td className="p-4 font-black text-pink-600">{assignment.routeStop}</td>
                      <td className="p-4 text-slate-500 font-medium">{assignment.locationName || "--"}</td>
                      <td className="p-4 text-center">
                        {assignment.latitude ? (
                          <span className="text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 w-fit mx-auto">
                            <CheckCircle2 size={10} />
                            Set ({assignment.latitude.toFixed(4)}, {assignment.longitude.toFixed(4)})
                          </span>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 w-fit mx-auto animate-pulse">
                            <AlertCircle size={10} />
                            Awaiting Mobile Setup
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                        No students assigned to school transport routes yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: REAL INTERACTIVE ROUTE MAP */}
          {activeTab === "map" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Sidebar filter controls */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Bus size={12} />
                    Select Vehicle Route
                  </label>
                  <select
                    value={selectedMapBusId}
                    onChange={(e) => {
                      setSelectedMapBusId(e.target.value);
                      setHoveredEntity(null);
                    }}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-pink-500 transition-colors"
                  >
                    <option value="">-- All Routes --</option>
                    {buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>{bus.busName}</option>
                    ))}
                  </select>
                </div>

                {/* Legend */}
                <div className="space-y-2 border-t pt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Map Legend</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <span className="h-3 w-3 rounded-full bg-blue-500 border-2 border-white shadow"></span>
                      School (Start Point)
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <span className="h-3 w-3 rounded-full bg-pink-500 border-2 border-white shadow"></span>
                      Bus Route Stop
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <span className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow"></span>
                      Student Home Pin
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <span className="h-5 w-8 border-2 border-pink-500 rounded" style={{background:'none'}}></span>
                      Bus Route Line
                    </div>
                  </div>
                </div>

                {/* Info for selected route */}
                {(() => {
                  const activeBus = buses.find(b => String(b.id) === selectedMapBusId);
                  if (!activeBus) return null;
                  const routeStops = typeof activeBus.routes === "string" ? JSON.parse(activeBus.routes) : activeBus.routes || [];
                  const activeS = assignments.filter(a => String(a.busId) === selectedMapBusId);
                  return (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Passengers</p>
                        <p className="text-lg font-black text-slate-900 tracking-tight">{activeS.length} / {activeBus.capacity}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Route Stops</p>
                        <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                          {routeStops.map((stop: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border rounded-xl text-[10px] font-bold text-slate-700">
                              <span className="h-5 w-5 bg-pink-100 text-pink-600 font-black rounded-lg flex items-center justify-center shrink-0">{idx + 1}</span>
                              <div className="flex-1 leading-tight">
                                <p className="text-slate-900 truncate">{stop.name}</p>
                                <p className="text-[8px] text-slate-400 uppercase font-black">{stop.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* REAL Leaflet Map */}
              <div className="lg:col-span-3 rounded-3xl relative overflow-hidden shadow-2xl min-h-[500px] border border-slate-200">
                {(() => {
                  const activeBus = buses.find(b => String(b.id) === selectedMapBusId);
                  const mapStops = activeBus
                    ? (typeof activeBus.routes === "string" ? JSON.parse(activeBus.routes) : activeBus.routes || [])
                    : buses.flatMap((b: any) => {
                        try { return typeof b.routes === "string" ? JSON.parse(b.routes) : b.routes || []; }
                        catch { return []; }
                      });
                  
                  const mapStudents = assignments.filter((a: any) =>
                    !selectedMapBusId || String(a.busId) === selectedMapBusId
                  );

                  return (
                    <LeafletRouteMap
                      key={selectedMapBusId}
                      stops={mapStops}
                      students={mapStudents}
                      centerLat={23.2599}
                      centerLng={77.4126}
                      height="500px"
                      onStudentClick={(student) => setHoveredEntity(student)}
                    />
                  );
                })()}

                {/* Selected student detail overlay */}
                {hoveredEntity && (
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 text-white shadow-2xl flex items-start gap-4 animate-in slide-in-from-bottom-3 duration-300 z-[1000]">
                    <div className="h-10 w-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <MapPin size={20} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black tracking-tight">{hoveredEntity.studentName}</h4>
                        <span className="text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">{hoveredEntity.className}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Stop: <span className="text-pink-400">{hoveredEntity.routeStop}</span> • Bus: {hoveredEntity.busName}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-normal truncate italic">📍 {hoveredEntity.locationName || "Registered via smartphone"}</p>
                      {hoveredEntity.latitude && <p className="text-[9px] text-slate-500 font-mono tracking-widest">{hoveredEntity.latitude.toFixed(6)}, {hoveredEntity.longitude.toFixed(6)}</p>}
                    </div>
                    <button onClick={() => setHoveredEntity(null)} className="h-6 w-6 hover:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* POPUP MODAL: ADD VEHICLE & STOPS CONFIG */}
      {showAddBusModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full shadow-2xl p-6 relative overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            
            <button 
              onClick={() => setShowAddBusModal(false)}
              className="absolute top-4 right-4 h-8 w-8 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl">
                <Bus size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Add Fleet Vehicle</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Register a bus and list route stops</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Bus Name / Plate No.</label>
                  <input
                    type="text"
                    value={busName}
                    onChange={(e) => setBusName(e.target.value)}
                    placeholder="e.g. Yellow Bus - MH-12-PQ-4567"
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-pink-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Bus Passenger Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="40"
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Morning Timings</label>
                  <input
                    type="text"
                    value={timingMorning}
                    onChange={(e) => setTimingMorning(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Evening Timings</label>
                  <input
                    type="text"
                    value={timingEvening}
                    onChange={(e) => setTimingEvening(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none"
                  />
                </div>
              </div>

              {/* Configured stops listing */}
              <div className="space-y-2 border-t pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configured Route Stops ({busStops.length})</p>
                <div className="space-y-2">
                  {busStops.map((stop, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 bg-pink-100 text-pink-600 font-black text-[9px] rounded-lg flex items-center justify-center shrink-0">{idx + 1}</span>
                        <span className="text-[10px] font-black text-slate-800">{stop.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{stop.time}</span>
                        {idx > 0 && (
                          <button onClick={() => setBusStops(busStops.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stop addition input tools */}
              <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Add Stop Point along route</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Stop Name (e.g. Lakeside Plaza)"
                    value={newStopName}
                    onChange={(e) => setNewStopName(e.target.value)}
                    className="text-xs font-bold bg-white border border-slate-200 text-slate-800 rounded-xl p-2.5 outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Pickup time"
                      value={newStopTime}
                      onChange={(e) => setNewStopTime(e.target.value)}
                      className="text-xs font-bold bg-white border border-slate-200 text-slate-800 rounded-xl p-2.5 outline-none flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddStop}
                      className="px-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700"
                    >
                      + Stop
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Save Action Buttons */}
            <div className="flex gap-3 border-t border-slate-100 pt-5 mt-6">
              <button
                onClick={() => setShowAddBusModal(false)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border text-slate-500 text-xs font-black uppercase tracking-wider rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBus}
                disabled={saving || !busName}
                className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-pink-500/10"
              >
                {saving ? "Saving..." : "Add Vehicle"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POPUP MODAL: ASSIGN STUDENT TO ROUTE */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            
            <button 
              onClick={() => setShowAssignModal(false)}
              className="absolute top-4 right-4 h-8 w-8 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Assign Student to Transport</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Link a student to a route stop</p>
              </div>
            </div>

            <div className="space-y-4">
              
              {/* Select Student */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none"
                >
                  <option value="">-- Choose Student --</option>
                  
                  {/* Group unassigned list first */}
                  <option disabled style={{ fontWeight: 'black', textTransform: 'uppercase', color: '#db2777' }}>-- Unassigned Students --</option>
                  {unassignedStudents.map(student => (
                    <option key={student.id} value={student.id}>{student.name} ({student.className})</option>
                  ))}

                  {/* Already assigned list as backup edit */}
                  <option disabled style={{ fontWeight: 'black', textTransform: 'uppercase', color: '#3b82f6' }}>-- Modify Active Assignments --</option>
                  {assignments.map(a => (
                    <option key={a.studentId} value={a.studentId}>{a.studentName} ({a.className}) [Assigned: {a.busName}]</option>
                  ))}
                </select>
              </div>

              {/* Select Bus */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Select Bus Route</label>
                <select
                  value={selectedBusId}
                  onChange={(e) => {
                    setSelectedBusId(e.target.value);
                    setSelectedStopName("");
                  }}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none"
                >
                  <option value="">-- Choose Bus Route --</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.id}>{bus.busName}</option>
                  ))}
                </select>
              </div>

              {/* Select Stop */}
              {selectedBusId && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Select Pickup Stop</label>
                  <select
                    value={selectedStopName}
                    onChange={(e) => setSelectedStopName(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 outline-none focus:border-pink-500"
                  >
                    <option value="">-- Choose Pickup Stop --</option>
                    {(() => {
                      const bus = buses.find(b => String(b.id) === selectedBusId);
                      if (!bus) return null;
                      const stops = typeof bus.routes === "string" ? JSON.parse(bus.routes) : bus.routes || [];
                      return stops.map((stop: any, i: number) => (
                        <option key={i} value={stop.name}>{stop.name} ({stop.time})</option>
                      ));
                    })()}
                  </select>
                </div>
              )}

              {/* Visual Coordinate locator (Allows pinning manually by admin as fallback) */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pin exact Location (Optional Fallback)</p>
                  <span className="text-[9px] font-bold text-slate-400 leading-none">Tap to Pin on Catchment Grid</span>
                </div>
                <div className="flex gap-4">
                  
                  {/* Styled Coordinate grid clicker box */}
                  <div
                    onClick={handleGridMapPinClick}
                    className="h-28 w-28 bg-slate-900 border border-slate-850 rounded-2xl relative cursor-crosshair overflow-hidden shadow-inner flex items-center justify-center text-slate-500 flex-shrink-0"
                  >
                    {/* Road grids overlay */}
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-ping absolute"></div>
                    <div className="h-2.5 w-2.5 bg-blue-600 rounded-full border border-white absolute shadow-md shadow-blue-500/50"></div>
                    
                    {/* Plotted manually coordinates pin indicator */}
                    {manualLat && (
                      <div
                        className="h-3 w-3 bg-pink-500 border border-white rounded-full absolute shadow-lg"
                        style={{
                          left: `${50 + ((manualLng! - CENTER_LNG) / 0.01) * 100}%`,
                          top: `${50 - ((manualLat! - CENTER_LAT) / 0.01) * 100}%`,
                        }}
                      />
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      placeholder="Type home address/location description"
                      value={studentAddress}
                      onChange={(e) => setStudentAddress(e.target.value)}
                      className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 outline-none focus:border-pink-500"
                    />
                    <div className="text-[9px] font-bold text-slate-400 leading-tight">
                      {manualLat ? (
                        <p className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          Coords Pinned: {manualLat.toFixed(5)}, {manualLng!.toFixed(5)}
                        </p>
                      ) : (
                        <p className="italic">Optional. If skipped, the student will pin their own GPS from their dashboard.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Save Action Buttons */}
            <div className="flex gap-3 border-t border-slate-100 pt-5 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border text-slate-500 text-xs font-black uppercase tracking-wider rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignStudent}
                disabled={saving || !selectedStudentId || !selectedBusId || !selectedStopName}
                className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-pink-500/10"
              >
                {saving ? "Assigning..." : "Assign Student"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
