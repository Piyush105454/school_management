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
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg text-white">
              <GraduationCap size={20} className="md:w-6 md:h-6" />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight uppercase text-slate-900">DPS Dhanpuri</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Vision', 'Mission', 'Infrastructure', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">
                {item}
              </a>
            ))}
            <a href="#login" className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all">
              PORTAL LOGIN
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-12 md:pb-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Hero Content - Second on mobile, First on desktop */}
          <div className="space-y-6 md:space-y-8 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-center">Admissions 2026-27</span>
            </div>
            <h1 className="text-3xl md:text-6xl font-bold text-slate-900 leading-tight">
              Empowering <span className="text-blue-600">Curiosity</span>,<br />
              Bridging Gaps.
            </h1>
            <p className="text-base md:text-lg text-slate-600 font-medium max-w-xl leading-relaxed">
              Dhanpuri Public School (DPS) is dedicated to accessible, high-quality education in underserved communities. Financial constraints should never limit a child's right to grow.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-lg font-bold hover:bg-blue-700 transition-all uppercase flex items-center justify-center gap-2">
                Explore Our Campus <ChevronRight size={18} />
              </button>
              <button className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 px-8 py-3.5 rounded-lg font-bold hover:bg-slate-50 transition-all uppercase text-center">
                Download Brochure
              </button>
            </div>
            
            <div className="pt-2 flex items-center gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                    <Users size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                    <p className="text-sm md:text-base font-bold text-slate-900 uppercase">12.5 student-teacher ratio</p>
                    <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">Focus on Personalized Learning</p>
                </div>
            </div>
          </div>

          {/* Login Section - First on mobile, Second on desktop */}
          <div id="login" className="w-full max-w-md mx-auto lg:mr-0 order-1 lg:order-2">
            <LoginForm />
            
            <div className="mt-6 pt-4 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Are you a new student?</p>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center justify-center gap-1 mx-auto">
                    Apply Online Now <ArrowRight size={14} />
                </button>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section id="vision" className="py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                <div className="space-y-8">
                    <div className="space-y-2">
                        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Our Philosophy</p>
                        <h2 className="text-4xl font-bold text-slate-900 tracking-tight uppercase">To Make Public Education Public</h2>
                    </div>
                    
                    <p className="text-lg text-slate-600 border-l-4 border-blue-600 pl-6">
                      We believe that education is not just the responsibility of schools but of society as a whole. The belief that education is the work of society drives everything we do.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-2">
                            <div className="h-10 w-10 bg-slate-900 text-white rounded-lg flex items-center justify-center"><Heart size={20} /></div>
                            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-sm">Empower Every Child</h4>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Ensuring girls and boys from all backgrounds have access to growth.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="h-10 w-10 bg-slate-900 text-white rounded-lg flex items-center justify-center"><Globe size={20} /></div>
                            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-sm">Community Driven</h4>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Deep involvement of parents, teachers, and local leaders.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-100 rounded-3xl aspect-square overflow-hidden shadow-md relative">
                    <img src="/images/school-vision.png" alt="DPS Students" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-6 bottom-6 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">Shared Responsibility</p>
                        <p className="text-xs text-slate-500 mt-1 uppercase">Building futures together</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Infrastructure Section */}
      <section id="infrastructure" className="py-24 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div className="space-y-3">
                    <p className="text-sm font-bold text-blue-400 uppercase tracking-widest">Smart Infrastructure</p>
                    <h2 className="text-4xl font-bold tracking-tight uppercase">Future-Ready Learning Spaces</h2>
                </div>
                <p className="max-w-sm text-slate-400 text-sm font-medium uppercase tracking-wider">
                  Equipped with modern tools to foster innovation and scientific exploration in Dhanpuri.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { name: 'Computer Lab', value: '30 Nodes', icon: Monitor, desc: 'High-speed internet & latest systems' },
                    { name: 'Smart Class', value: 'Projector', icon: Cpu, desc: 'Interactive digital learning' },
                    { name: 'Library', value: '800+ Books', icon: Library, desc: 'Diverse collection for curiosity' },
                    { name: 'Science Zone', value: 'Hands-on', icon: FlaskConical, desc: 'Experimental learning space' }
                ].map((item, i) => (
                    <div key={item.name} className="bg-white/5 border border-white/10 p-8 rounded-2xl">
                        <item.icon className="text-blue-400 mb-6" size={32} />
                        <h4 className="text-xl font-bold uppercase mb-1">{item.name}</h4>
                        <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-4">{item.value}</p>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
            
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white/5 p-10 rounded-3xl border border-white/10">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-500" size={20} />
                        <span className="text-sm font-bold uppercase tracking-wider">Registered MP Board</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-500" size={20} />
                        <span className="text-sm font-bold uppercase tracking-wider">DISE Code: 23161219802</span>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Dhanpuri Public School serves students from Kindergarten (KG1) to Class 5, with middle-school expansion plans already in motion.
                    </p>
                </div>
                <div className="flex justify-end gap-12">
                   <div className="text-center">
                       <p className="text-4xl font-bold text-blue-400">07</p>
                       <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-slate-500">Classrooms</p>
                   </div>
                   <div className="text-center">
                       <p className="text-4xl font-bold text-blue-400">12</p>
                       <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-slate-500">Instructors</p>
                   </div>
                   <div className="text-center">
                       <p className="text-4xl font-bold text-blue-400">100%</p>
                       <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-slate-500">Inclusive</p>
                   </div>
                </div>
            </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <MapPin size={32} />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 uppercase">Dhanpuri, Shahdol (M.P.)</h3>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Located in the heart of Dhanpuri, Shahdol district, we are bringing quality education to the doorsteps of daily wage workers and small business families in Madhya Pradesh.</p>
            <div className="pt-6 flex justify-center gap-4">
                 <button className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold text-xs uppercase hover:bg-slate-800 transition-all">Find Directions</button>
                 <button className="bg-white border border-slate-200 text-slate-900 px-8 py-3 rounded-lg font-bold text-xs uppercase hover:bg-slate-50 transition-all">Contact Info</button>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 text-slate-400">
            <GraduationCap size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">DPS Dhanpuri</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">© 2026 Dhanpuri Public School. Transforming society through learning.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Support'].map(item => (
                <a key={item} href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">{item}</a>
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
