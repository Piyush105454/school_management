"use client";

import React, { useState } from "react";
import { 
  GraduationCap, 
  MapPin, 
  BookOpen, 
  Users, 
  Heart, 
  ShieldCheck, 
  Globe, 
  Cpu, 
  Library, 
  Monitor, 
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/features/auth/components/LoginForm";

export function LandingPage() {

  return (
    <div className="min-h-screen bg-[#fcfdff] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-black font-outfit tracking-tighter uppercase text-slate-900">DPS Dhanpuri</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Vision', 'Mission', 'Infrastructure', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest leading-none">
                {item}
              </a>
            ))}
            <a href="#login" className="bg-slate-950 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-black/10">
              PORTAL LOGIN
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-left-4 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full border border-blue-100 mb-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest">Admissions Open 2026-27</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-slate-900 font-outfit leading-[0.95] tracking-tighter">
              Empowering <span className="text-blue-600">Curiosity</span>,<br />
              Bridging Gaps.
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-xl leading-relaxed">
              Dhanpuri Public School (DPS) is dedicated to accessible, high-quality education in underserved communities. Financial constraints should never limit a child's right to grow.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black tracking-tight hover:bg-blue-700 transition-all hover:scale-105 shadow-2xl shadow-blue-500/20 uppercase flex items-center gap-2">
                Explore Our Campus <ChevronRight size={18} />
              </button>
              <button className="bg-white border border-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-black tracking-tight hover:bg-slate-50 transition-all shadow-sm uppercase">
                Download Brochure
              </button>
            </div>
            
            <div className="pt-8 flex items-center gap-8">
                <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-12 w-12 rounded-full border-2 border-white bg-slate-100 overflow-hidden ring-4 ring-blue-50/50">
                             <img src={`https://i.pravatar.cc/100?u=${i}`} alt="Student" />
                        </div>
                    ))}
                </div>
                <div>
                    <p className="text-sm font-black text-slate-900 uppercase">12.5 student-teacher ratio</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Focus on Personalized Learning</p>
                </div>
            </div>
          </div>

          {/* Login Card on Landing Page */}
          <div id="login" className="relative group animate-in fade-in slide-in-from-right-4 duration-1000">
            <div className="absolute inset-0 bg-blue-500 rounded-[3rem] rotate-3 opacity-10 group-hover:rotate-6 transition-transform duration-700"></div>
            <div className="absolute inset-0 bg-indigo-500 rounded-[3rem] -rotate-3 opacity-10 group-hover:-rotate-6 transition-transform duration-700"></div>
            
            <div className="relative bg-white/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
              <LoginForm />
              
              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Are you a new student?</p>
                  <button className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-[0.1em] flex items-center justify-center gap-1 mx-auto group/link">
                      Apply Online Now <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                  </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Abstract Orbs */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-100 rounded-full blur-[120px] opacity-30 -z-10"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-100 rounded-full blur-[100px] opacity-40 -z-10"></div>
      </section>

      {/* Vision & Mission */}
      <section id="vision" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
                <div className="space-y-10">
                    <div className="space-y-4">
                        <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em]">Our Philosophy</h2>
                        <h3 className="text-5xl font-black text-slate-900 font-outfit tracking-tighter uppercase leading-[0.95]">To Make Public Education Public</h3>
                    </div>
                    
                    <p className="text-lg text-slate-600 font-medium leading-relaxed italic border-l-4 border-blue-600 pl-6">
                        "We believe that education is not just the responsibility of schools but of society as a whole. The belief that education is the work of society drives everything we do."
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg"><Heart size={20} /></div>
                            <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">Empower Every Child</h4>
                            <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase tracking-wider">Ensuring girls and boys from all backgrounds have access to growth.</p>
                        </div>
                        <div className="space-y-3">
                            <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg"><Globe size={20} /></div>
                            <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">Community Driven</h4>
                            <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase tracking-wider">Deep involvement of parents, teachers, and local leaders.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-100 rounded-[3rem] aspect-square overflow-hidden shadow-2xl relative rotate-3 group overflow-hidden">
                    <img src="/images/school-vision.png" alt="DPS Students" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] grayscale hover:grayscale-0" />
                    <div className="absolute inset-0 bg-blue-600/20 mix-blend-overlay"></div>
                    <div className="absolute bottom-8 left-8 right-8 bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/30">
                        <p className="text-sm font-black text-slate-950 uppercase tracking-widest">Shared Responsibility</p>
                        <p className="text-xs text-slate-900 font-bold mt-1 uppercase opacity-80">Building futures together</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Infrastructure Section */}
      <section id="infrastructure" className="py-32 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
                <div className="space-y-4">
                    <h2 className="text-sm font-black text-blue-400 uppercase tracking-[0.3em]">Smart Infrastructure</h2>
                    <h3 className="text-5xl font-black font-outfit tracking-tighter uppercase leading-[0.95]">Future-Ready <br />Learning Spaces</h3>
                </div>
                <div className="max-w-sm">
                    <p className="text-slate-400 font-bold text-sm leading-relaxed uppercase tracking-widest opacity-60">Equipped with modern tools to foster innovation and scientific exploration in Dhanpuri.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { name: 'Computer Lab', value: '30 Nodes', icon: Monitor, desc: 'High-speed internet & latest systems' },
                    { name: 'Smart Class', value: 'Projector', icon: Cpu, desc: 'Interactive digital learning' },
                    { name: 'Library', value: '800+ Books', icon: Library, desc: 'Diverse collection for curiosity' },
                    { name: 'Science Zone', value: 'Hands-on', icon: FlaskConical, desc: 'Experimental learning space' }
                ].map((item, i) => (
                    <div key={item.name} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-blue-600/10 cursor-default transition-all group">
                        <item.icon className="text-blue-400 mb-6 group-hover:scale-110 transition-transform" size={40} />
                        <h4 className="text-2xl font-black font-outfit tracking-tight uppercase mb-1">{item.name}</h4>
                        <p className="text-blue-400 font-black text-xs uppercase tracking-widest mb-4">{item.value}</p>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-loose">{item.desc}</p>
                    </div>
                ))}
            </div>
            
            <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white/5 p-12 rounded-[3rem] border border-white/10">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-500" />
                        <span className="text-sm font-black uppercase tracking-widest">Registered MP Board</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-500" />
                        <span className="text-sm font-black uppercase tracking-widest">DISE Code: 23161219802</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        Dhanpuri Public School serves students from Kindergarten (KG1) to Class 5, with middle-school expansion plans already in motion.
                    </p>
                </div>
                <div className="flex justify-end gap-12">
                   <div className="text-center">
                       <p className="text-5xl font-black font-outfit text-blue-400 leading-none">07</p>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-3 text-slate-500">Classrooms</p>
                   </div>
                   <div className="text-center">
                       <p className="text-5xl font-black font-outfit text-blue-400 leading-none">12</p>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-3 text-slate-500">Instructors</p>
                   </div>
                   <div className="text-center">
                       <p className="text-5xl font-black font-outfit text-blue-400 leading-none">100%</p>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-3 text-slate-500">Inclusive</p>
                   </div>
                </div>
            </div>
        </div>
        
        {/* Background Mesh */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 outline outline-4 outline-blue-50/50">
                <MapPin size={32} />
            </div>
            <h3 className="text-4xl font-black text-slate-900 font-outfit tracking-tighter uppercase">Dhanpuri, Shahdol (M.P.)</h3>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">Located in the heart of Dhanpuri, Shahdol district, we are bringing quality education to the doorsteps of daily wage workers and small business families in Madhya Pradesh.</p>
            <div className="pt-8 flex justify-center gap-4">
                 <button className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black tracking-widest text-xs hover:bg-slate-800 transition-all uppercase">Find Directions</button>
                 <button className="bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-2xl font-black tracking-widest text-xs hover:bg-slate-50 transition-all uppercase">Contact Info</button>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 grayscale brightness-50 opacity-50">
            <GraduationCap size={20} />
            <span className="text-sm font-black uppercase tracking-widest">DPS Dhanpuri</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 Dhanpuri Public School. Transforming society through learning.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Support'].map(item => (
                <a key={item} href="#" className="text-xs font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function FlaskConical(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 2v7.5" />
      <path d="M14 2v7.5" />
      <path d="M8.5 13H15.5" />
      <path d="M7 22h10l-5-14.5z" />
    </svg>
  );
}
