"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

interface Action {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface ActionDropdownProps {
  actions: Action[];
  align?: "left" | "right";
}

export function ActionDropdown({ actions, align = "right" }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div 
          className={`absolute z-50 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold transition-colors ${
                action.variant === "danger" 
                  ? "text-red-600 hover:bg-red-50" 
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {action.icon && <span className="opacity-70">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
