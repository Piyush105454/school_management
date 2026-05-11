"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface InstituteContextType {
  selectedInstitute: string;
  setSelectedInstitute: (institute: string) => void;
  institutes: string[];
  loading: boolean;
}

const InstituteContext = createContext<InstituteContextType | undefined>(undefined);

export function InstituteProvider({ children }: { children: ReactNode }) {
  const [selectedInstitute, setSelectedInstituteState] = useState<string>("ALL");
  const [institutes, setInstitutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 1. Initial load from localStorage
  useEffect(() => {
    const savedInstitute = localStorage.getItem("selectedInstitute");
    if (savedInstitute) {
      setSelectedInstituteState(savedInstitute);
    }
    
    // Fetch unique institutes
    fetch("/api/institutes")
      .then(res => res.json())
      .then(data => {
        setInstitutes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch institutes:", err);
        setLoading(false);
      });
  }, []);

  // 2. Sync URL with state
  useEffect(() => {
    const urlInstitute = searchParams.get("institute");
    
    // If URL has it, update state (covers initial load from URL or manual URL change)
    if (urlInstitute && urlInstitute !== selectedInstitute) {
      setSelectedInstituteState(urlInstitute);
      localStorage.setItem("selectedInstitute", urlInstitute);
      return;
    }

    // If URL doesn't have it, but we have a selection (not ALL), push it to URL
    if (!urlInstitute && selectedInstitute !== "ALL") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("institute", selectedInstitute);
      // Use replace to avoid polluting history with sync redirects
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [pathname, searchParams, selectedInstitute, router]);

  const setSelectedInstitute = (institute: string) => {
    setSelectedInstituteState(institute);
    localStorage.setItem("selectedInstitute", institute);
    
    // Update URL if we are on a page that should be filtered
    // For now, let's just update the URL query param
    const params = new URLSearchParams(searchParams.toString());
    if (institute === "ALL") {
      params.delete("institute");
    } else {
      params.set("institute", institute);
    }
    
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  return (
    <InstituteContext.Provider value={{ selectedInstitute, setSelectedInstitute, institutes, loading }}>
      {children}
    </InstituteContext.Provider>
  );
}

export function useInstitute() {
  const context = useContext(InstituteContext);
  if (context === undefined) {
    throw new Error("useInstitute must be used within an InstituteProvider");
  }
  return context;
}
