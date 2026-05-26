"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Camera, ShieldCheck, Search, Users, RefreshCw, X, Circle, HelpCircle } from "lucide-react";
import Link from "next/link";
import { 
  getAllEnrolledStudentsAction, 
  saveFaceEmbeddingAction, 
  markKioskAttendanceAction 
} from "@/features/academy/actions/faceActions";
import { cn } from "@/lib/utils";

interface ClassItem {
  id: number;
  name: string;
}

interface EnrolledStudent {
  id: number;
  name: string;
  rollNumber: string | null;
  studentId: string;
  faceEmbedding: number[] | null;
  classId: number | null;
  className: string;
}

interface KioskScannerClientProps {
  classes: ClassItem[];
}

export default function KioskScannerClient({ classes }: KioskScannerClientProps) {
  const [activeTab, setActiveTab] = useState<"kiosk" | "enroll">("kiosk");
  const [studentsList, setStudentsList] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Script and Model loading states
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Loading face recognition libraries...");

  // Scanner UI States
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<{
    name: string;
    className: string;
    rollNumber: string | null;
    studentId: string;
    alreadyMarked: boolean;
  } | null>(null);
  
  // Registration States
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [registerStatus, setRegisterStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [registering, setRegistering] = useState(false);

  // References for Webcams & Loops
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionLoopRef = useRef<number | null>(null);
  const isLockedRef = useRef(false);

  // Synth Chime Beep (Web Audio API)
  const playBeep = (type: "success" | "warn") => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High-pitched clean beep (A5)
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime); // Low buzz for warn (A3)
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio Context playback blocked by browser autocomplete", e);
    }
  };

  // Text-To-Speech Speech Synthesis
  const speakGreeting = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Terminate pending utterances
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // 1. Dynamic Script Loader for Vladmandic's optimized Face-API
  useEffect(() => {
    const scriptId = "face-api-script";
    const existingScript = document.getElementById(scriptId);
    
    const onScriptLoad = () => {
      setFaceApiLoaded(true);
      loadNeuralModels();
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js";
      script.async = true;
      script.onload = onScriptLoad;
      script.onerror = () => {
        setStatusMessage("Failed to load CDN face recognition library. Check connection.");
      };
      document.body.appendChild(script);
    } else if ((window as any).faceapi) {
      onScriptLoad();
    }

    // Load initial student listing
    fetchStudents();

    return () => {
      stopCamera();
    };
  }, []);

  const fetchStudents = async () => {
    const res = await getAllEnrolledStudentsAction();
    if (res.success && res.data) {
      setStudentsList(res.data);
    }
    setLoading(false);
  };

  // 2. Load Deep Learning weights from stable jsDelivr Master weights branch
  const loadNeuralModels = async () => {
    try {
      const faceapi = (window as any).faceapi;
      if (!faceapi) return;

      setStatusMessage("Loading Face Detector Network (1/3)...");
      const modelUrl = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/";
      
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
      setStatusMessage("Loading Face Landmark Network (2/3)...");
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
      setStatusMessage("Loading Face Feature Recognition (3/3)...");
      await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
      
      setModelsLoaded(true);
      setIsScanning(true);
      setStatusMessage("Face recognition engines online!");
    } catch (err: any) {
      console.error("Neural model loading error:", err);
      setStatusMessage("Error parsing neural network files. Try refreshing.");
    }
  };

  // 3. Camera Streams controllers
  const startCamera = async () => {
    stopCamera();
    isLockedRef.current = false; // Reset lock reference when camera restarts
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          if (activeTab === "kiosk" && modelsLoaded) {
            startRecognitionLoop();
          }
        };
      }
    } catch (err) {
      alert("Camera access denied or webcam in use. Enable camera permissions.");
    }
  };

  const stopCamera = () => {
    if (recognitionLoopRef.current) {
      cancelAnimationFrame(recognitionLoopRef.current);
      recognitionLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Keep camera running on active tabs
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [activeTab, modelsLoaded]);

  // 4. Real-time scanner execution loop
  const startRecognitionLoop = () => {
    const faceapi = (window as any).faceapi;
    if (!faceapi || !videoRef.current || !canvasRef.current || isLockedRef.current) return;

    const runMatch = async () => {
      if (isLockedRef.current) return; // Halt loop completely on active lock

      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        recognitionLoopRef.current = requestAnimationFrame(runMatch);
        return;
      }

      // Fast TinyFaceDetector options for 60fps local checks
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
      
      const detection = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      
      if (canvas && ctx && videoRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (detection) {
          const resized = faceapi.resizeResults(detection, {
            width: canvas.width,
            height: canvas.height
          });
          
          // Draw tracking target box
          const box = resized.detection.box;
          ctx.strokeStyle = "#F43F5E"; // Rose neon
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.shadowColor = "rgba(244, 63, 94, 0.4)";
          ctx.shadowBlur = 10;
          
          // Draw rounded bounding target brackets
          const r = 12;
          ctx.beginPath();
          // Top Left
          ctx.moveTo(box.x, box.y + r);
          ctx.quadraticCurveTo(box.x, box.y, box.x + r, box.y);
          // Top Right
          ctx.moveTo(box.x + box.width - r, box.y);
          ctx.quadraticCurveTo(box.x + box.width, box.y, box.x + box.width, box.y + r);
          // Bottom Right
          ctx.moveTo(box.x + box.width, box.y + box.height - r);
          ctx.quadraticCurveTo(box.x + box.width, box.y + box.height, box.x + box.width - r, box.y + box.height);
          // Bottom Left
          ctx.moveTo(box.x + r, box.y + box.height);
          ctx.quadraticCurveTo(box.x, box.y + box.height, box.x, box.y + box.height - r);
          ctx.stroke();

          // Calculate Euclidean vector distances globally
          const enrolled = studentsList.filter(s => s.faceEmbedding !== null);
          let bestMatch: EnrolledStudent | null = null;
          let minDistance = 1.0;

          if (enrolled.length > 0 && detection.descriptor) {
            const liveDescriptor = detection.descriptor;
            
            enrolled.forEach(student => {
              const savedDescriptor = student.faceEmbedding!;
              // Mathematical sum of squared difference
              let sum = 0;
              for (let i = 0; i < 128; i++) {
                const diff = liveDescriptor[i] - savedDescriptor[i];
                sum += diff * diff;
              }
              const distance = Math.sqrt(sum);
              if (distance < minDistance) {
                minDistance = distance;
                bestMatch = student;
              }
            });
          }

          // Matching Threshold
          const THRESHOLD = 0.55; 
          if (bestMatch && minDistance < THRESHOLD) {
            const confidence = Math.max(0, Math.min(100, Math.round((1 - minDistance) * 100)));
            
            // Draw matching status on target
            ctx.fillStyle = "#10B981"; // Emerald green
            ctx.font = "bold 13pxOutfit, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(
              `${bestMatch.name} (${confidence}%)`, 
              box.x + box.width / 2, 
              box.y - 12
            );

            // Execute database log
            triggerKioskCheckIn(bestMatch.id);
          } else {
            ctx.fillStyle = "#FDA4AF"; // Alert rose
            ctx.font = "bold 12px Outfit, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Scanning Student Face...", box.x + box.width / 2, box.y - 12);
          }
        }
      }

      // Check loop condition
      if (!isLockedRef.current) {
        recognitionLoopRef.current = requestAnimationFrame(runMatch);
      }
    };

    recognitionLoopRef.current = requestAnimationFrame(runMatch);
  };

  // 5. Database check-in dispatcher
  const triggerKioskCheckIn = async (studentId: number) => {
    // Lock loop temporarily to prevent multi-marking on server frames
    if (isLockedRef.current) return;
    isLockedRef.current = true;
    
    // Create optimistic target details
    const student = studentsList.find(s => s.id === studentId);
    if (!student) {
      isLockedRef.current = false;
      return;
    }

    // Halt camera scan loops
    if (recognitionLoopRef.current) {
      cancelAnimationFrame(recognitionLoopRef.current);
      recognitionLoopRef.current = null;
    }

    setScannedStudent({
      name: student.name,
      className: student.className,
      rollNumber: student.rollNumber,
      studentId: student.studentId,
      alreadyMarked: false
    });

    try {
      const res = await markKioskAttendanceAction(studentId);
      if (res.success) {
        playBeep(res.alreadyMarked ? "warn" : "success");
        
        setScannedStudent({
          name: res.studentName || student.name,
          className: student.className,
          rollNumber: res.rollNumber,
          studentId: res.studentIdString || student.studentId,
          alreadyMarked: !!res.alreadyMarked
        });

        // Trigger Speech Greeting
        if (res.alreadyMarked) {
          speakGreeting(`${res.studentName}, your attendance was already marked today.`);
        } else {
          speakGreeting(`Welcome, ${res.studentName}. Your daily attendance is recorded successfully.`);
        }
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      alert("Error marking attendance: " + e.message);
      isLockedRef.current = false;
      resetScanner();
    }

    // Rearm loops automatically after 3.5 seconds
    setTimeout(() => {
      resetScanner();
    }, 3500);
  };

  const resetScanner = () => {
    setScannedStudent(null);
    isLockedRef.current = false; // Release the lock
    if (activeTab === "kiosk" && modelsLoaded) {
      // Clear canvas context
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      startRecognitionLoop(); // Re-trigger loop
    }
  };

  // 6. Face Enrollment snapshot capture
  const handleEnrollFace = async () => {
    if (!selectedStudentId) {
      alert("Please select a student from the register listing first.");
      return;
    }

    const faceapi = (window as any).faceapi;
    if (!faceapi || !videoRef.current) {
      alert("Face recognition systems are offline. Refresh page.");
      return;
    }

    setRegistering(true);
    setRegisterStatus(null);

    try {
      // Run high-precision detection
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
      const detection = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        playBeep("warn");
        setRegisterStatus({
          type: "error",
          text: "No face detected in the frame. Sit up straight in front of camera."
        });
        setRegistering(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const res = await saveFaceEmbeddingAction(selectedStudentId, descriptor);
      
      if (res.success) {
        playBeep("success");
        setRegisterStatus({
          type: "success",
          text: "Student face registered and vector template saved!"
        });
        // Sync student local data
        setStudentsList(prev => prev.map(s => {
          if (s.id === selectedStudentId) {
            return { ...s, faceEmbedding: descriptor };
          }
          return s;
        }));
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      setRegisterStatus({
        type: "error",
        text: e.message || "Failed to parse camera frames."
      });
    } finally {
      setRegistering(false);
    }
  };

  // Filter students based on search string
  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.className && s.className.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedStudent = studentsList.find(s => s.id === selectedStudentId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-outfit p-4 md:p-6 select-none">
      
      {/* 1. Header Area */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <Link 
            href="/office/academy-management/attendance" 
            className="h-10 w-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-100 transition-all active:scale-95 shadow-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg md:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-rose-500 animate-pulse" />
              Autonomous Kiosk Attendance
            </h1>
            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-black">
              DPS DHANPURI AI SCANNER
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button 
            onClick={() => {
              setActiveTab("kiosk");
              setRegisterStatus(null);
            }}
            className={cn(
              "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-xl transition-all",
              activeTab === "kiosk" 
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            ⚡ Live Scanner
          </button>
          <button 
            onClick={() => {
              setActiveTab("enroll");
              setRegisterStatus(null);
            }}
            className={cn(
              "px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-xl transition-all",
              activeTab === "enroll" 
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            📸 Face Register
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
        
        {/* LEFT COLUMN: Camera Stream Viewport (Takes 7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-4 md:p-6 bg-slate-900/40 border border-slate-900 rounded-3xl backdrop-blur-xl relative overflow-hidden min-h-[480px]">
          
          {/* Cyberpunk Grid/Corner Elements */}
          <div className="absolute top-4 left-4 h-4 w-4 border-t-2 border-l-2 border-rose-500" />
          <div className="absolute top-4 right-4 h-4 w-4 border-t-2 border-r-2 border-rose-500" />
          <div className="absolute bottom-4 left-4 h-4 w-4 border-b-2 border-l-2 border-rose-500" />
          <div className="absolute bottom-4 right-4 h-4 w-4 border-b-2 border-r-2 border-rose-500" />
          
          {/* Engine Loaders Info Bar */}
          <div className="flex items-center justify-between pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <span className="flex items-center gap-1.5">
              <Circle className={cn("h-2.5 w-2.5", modelsLoaded ? "fill-emerald-500 text-emerald-500 animate-pulse" : "fill-amber-500 text-amber-500")} />
              {statusMessage}
            </span>
            <span>Local GPU Acceleration: Active</span>
          </div>

          {/* Web Video Screen Wrapper */}
          <div className="flex-1 flex items-center justify-center relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 shadow-inner group">
            
            {/* The live webcam feeds */}
            <video 
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover scale-x-[-1]" // Flip mirrored camera natively
            />

            {/* Tracking brackets overlay canvas */}
            <canvas 
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 h-full w-full object-cover scale-x-[-1] z-10 pointer-events-none"
            />

            {/* Cyberpunk neon scanner laser line (Tab: Kiosk only) */}
            {activeTab === "kiosk" && modelsLoaded && !scannedStudent && (
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_15px_#f43f5e] z-10 animate-laser" />
            )}

            {/* Circular targeting reticle frame for kiosk layout */}
            {activeTab === "kiosk" && modelsLoaded && !scannedStudent && (
              <div className="absolute h-52 w-52 md:h-64 md:w-64 border border-slate-800/40 rounded-full z-10 flex items-center justify-center border-dashed group-hover:scale-105 transition-transform duration-500">
                <div className="h-44 w-44 md:h-56 md:w-56 border border-slate-700/30 rounded-full border-double animate-spin duration-30s" />
              </div>
            )}

            {/* Full-Screen glassmorphic scanner verification card */}
            {scannedStudent && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className={cn(
                  "p-6 rounded-3xl border text-center max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 relative animate-in slide-in-from-bottom-6 duration-300",
                  scannedStudent.alreadyMarked
                    ? "bg-amber-950/20 border-amber-500/30 shadow-amber-500/5"
                    : "bg-emerald-950/20 border-emerald-500/30 shadow-emerald-500/5"
                )}>
                  {/* Status Ring */}
                  <div className={cn(
                    "h-16 w-16 rounded-full flex items-center justify-center border-4 animate-bounce",
                    scannedStudent.alreadyMarked
                      ? "border-amber-500 text-amber-500 bg-amber-500/10"
                      : "border-emerald-500 text-emerald-500 bg-emerald-500/10"
                  )}>
                    <ShieldCheck className="h-8 w-8" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">STUDENT IDENTIFIED</p>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">{scannedStudent.name}</h2>
                    <p className="text-xs font-bold text-slate-300">{scannedStudent.className}</p>
                    <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase">
                      ID: {scannedStudent.studentId} | ROLL: {scannedStudent.rollNumber || "--"}
                    </p>
                  </div>

                  <div className={cn(
                    "w-full py-2.5 rounded-xl text-center text-xs font-black uppercase tracking-widest",
                    scannedStudent.alreadyMarked
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  )}>
                    {scannedStudent.alreadyMarked ? "Already Logged Today" : "Attendance Recorded!"}
                  </div>
                  
                  <p className="text-[9px] text-slate-500 italic animate-pulse">Automatically rearming scanner...</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-between text-[9px] text-slate-500 uppercase tracking-widest font-black">
            <span>Camera Node: Front Camera</span>
            <span>FPS Target: 30hz</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Dashboard Tools (Takes 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900/20 border border-slate-900 rounded-3xl p-4 md:p-6 backdrop-blur-xl max-h-[640px] overflow-hidden">
          
          {/* TAB 1 CONTENT: KIOSK TIMELINE EVENTS */}
          {activeTab === "kiosk" && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="space-y-1.5 pb-4 border-b border-slate-900">
                <h2 className="text-sm font-black uppercase text-slate-300 flex items-center gap-2">
                  <Circle className="h-2.5 w-2.5 fill-rose-500 text-rose-500 animate-pulse" />
                  Scanner Console Logs
                </h2>
                <p className="text-[10px] text-slate-400 font-bold">Matched check-ins display instantly here.</p>
              </div>

              {/* Console events viewport */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 font-mono text-[10px] text-slate-400 select-text">
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-900 space-y-1 text-slate-500">
                  <p className="font-bold text-rose-400">⚡ Autonomous Mode Enabled</p>
                  <p>- Neural nets active locally in browser.</p>
                  <p>- Speech Voice Synthesis active.</p>
                  <p>- Distance thresholds configured: 0.55</p>
                  <p>- Ready to scan! Please stand in front of the camera.</p>
                </div>

                {scannedStudent && (
                  <div className={cn(
                    "p-3 rounded-2xl border space-y-1 animate-in slide-in-from-bottom-2 duration-200",
                    scannedStudent.alreadyMarked
                      ? "bg-amber-950/10 border-amber-500/10 text-amber-400"
                      : "bg-emerald-950/10 border-emerald-500/10 text-emerald-400"
                  )}>
                    <p className="font-bold uppercase tracking-wider">
                      {scannedStudent.alreadyMarked ? "[WARN]" : "[OK]"} Match Recognized
                    </p>
                    <p>Name: {scannedStudent.name}</p>
                    <p>ID: {scannedStudent.studentId}</p>
                    <p>Status: {scannedStudent.alreadyMarked ? "Already Logged" : "Present Marked"}</p>
                    <p>Timestamp: {new Date().toLocaleTimeString()}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-900 text-center space-y-2">
                <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-slate-400">
                  <Users className="h-4.5 w-4.5 text-rose-500" />
                  Total Enrolled Faces: {studentsList.filter(s => s.faceEmbedding !== null).length} / {studentsList.length}
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                  Place camera at lobby entrance for automatic hands-free login.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2 CONTENT: FACE ENROLLMENT DIRECTORY */}
          {activeTab === "enroll" && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="space-y-4 pb-4 border-b border-slate-900">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase text-slate-300 flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-rose-500" />
                    Student Face Registry
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold">Select a student below to register their face.</p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Name, Roll, or Class..."
                    className="w-full bg-slate-950 border border-slate-900 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-300 outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              {/* Student Lists Panel */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-6 w-6 text-rose-500 animate-spin" />
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Loading registers...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-20 text-center text-xs text-slate-500 italic">
                    No matching student records found.
                  </div>
                ) : (
                  filteredStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setRegisterStatus(null);
                      }}
                      className={cn(
                        "w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98",
                        selectedStudentId === student.id 
                          ? "bg-rose-950/15 border-rose-500/40" 
                          : "bg-slate-950/40 border-slate-900 hover:border-slate-800"
                      )}
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black uppercase text-white tracking-tight">{student.name}</h4>
                        <p className="text-[9px] text-slate-400 uppercase font-black">
                          Class: {student.className} | Roll: {student.rollNumber || "--"}
                        </p>
                      </div>
                      
                      {student.faceEmbedding ? (
                        <span className="text-[8px] font-black uppercase px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Registered
                        </span>
                      ) : (
                        <span className="text-[8px] font-black uppercase px-2 py-1 rounded bg-slate-800 text-slate-500 border border-slate-700/20">
                          No Face Saved
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Snapshot enrollment button */}
              {selectedStudent && (
                <div className="pt-4 border-t border-slate-900 space-y-3 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-900 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">ACTIVE REGISTRATION TARGET</p>
                      <h3 className="text-xs font-black uppercase text-white">{selectedStudent.name}</h3>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">{selectedStudent.className}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedStudentId(null)}
                      className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-slate-200"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {registerStatus && (
                    <div className={cn(
                      "p-3 rounded-2xl text-[10px] font-bold text-center animate-in zoom-in-95 duration-200",
                      registerStatus.type === "success" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    )}>
                      {registerStatus.text}
                    </div>
                  )}

                  <button
                    onClick={handleEnrollFace}
                    disabled={registering || !modelsLoaded}
                    className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-transparent text-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-2 border border-rose-600"
                  >
                    {registering ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Scanning Frame Vector...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4" />
                        Capture & Register Face
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
