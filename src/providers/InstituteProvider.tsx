"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
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

  // Tracks whether initial mount setup is done so the URL sync effect
  // doesn't fire too early (before localStorage has been read).
  const initialized = useRef(false);

  // Effect 1 – runs once on mount.
  // Priority order:  URL param  >  localStorage  >  default "ALL"
  // IMPORTANT: we never auto-push a stored value back into the URL here.
  // The URL is only updated when the user explicitly picks an institute.
  useEffect(() => {
    initialized.current = true;

    const urlInstitute = searchParams.get("institute");
    const saved = localStorage.getItem("selectedInstitute");

    if (urlInstitute) {
      // URL has an explicit selection – use it as source of truth
      setSelectedInstituteState(urlInstitute);
      localStorage.setItem("selectedInstitute", urlInstitute);
    } else if (saved) {
      // No URL param – restore whatever the user last picked (may be "ALL")
      setSelectedInstituteState(saved);
      // DO NOT redirect here. If they last chose "ALL" we must honour that.
    }

    // Load the available institutes for the dropdown
    fetch("/api/institutes")
      .then((res) => res.json())
      .then((data: string[]) => {
        setInstitutes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch institutes:", err);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // Effect 2 – runs when the URL's search params change (e.g. after navigation).
  // We READ from the URL; we NEVER push state back to the URL automatically.
  // This prevents the old bug where choosing "All Institutes" was immediately
  // overridden by an auto-redirect that re-added ?institute=DPS.
  useEffect(() => {
    if (!initialized.current) return; // skip the very first render

    const urlInstitute = searchParams.get("institute");

    if (urlInstitute) {
      // URL specifies a concrete institute – sync dropdown & localStorage
      if (urlInstitute !== selectedInstitute) {
        setSelectedInstituteState(urlInstitute);
        localStorage.setItem("selectedInstitute", urlInstitute);
      }
    } else {
      // No institute in the URL means "All Institutes" was selected or the
      // page doesn't filter by institute. Set the dropdown to "ALL".
      if (selectedInstitute !== "ALL") {
        setSelectedInstituteState("ALL");
        localStorage.setItem("selectedInstitute", "ALL");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // only re-run when URL params change

  // Called when the user explicitly picks an institute from the dropdown
  const setSelectedInstitute = (institute: string) => {
    setSelectedInstituteState(institute);
    localStorage.setItem("selectedInstitute", institute);

    const params = new URLSearchParams(searchParams.toString());
    if (institute === "ALL") {
      params.delete("institute");
    } else {
      params.set("institute", institute);
    }

    // Avoid trailing "?" when there are no query params
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    // No router.refresh() — router.push already triggers a full server re-render
    // so pages that read searchParams will receive the updated institute value.
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
