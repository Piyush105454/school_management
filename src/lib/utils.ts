import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "-";
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (e) {
    return String(date);
  }
}

export function formatTime(timeStr: string | null | undefined) {
  if (!timeStr) return "-";
  try {
    const [hourStr, minute] = timeStr.split(":");
    if (!hourStr || !minute) return timeStr;
    
    let hour = parseInt(hourStr);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12; // the hour '0' should be '12'
    
    return `${hour}:${minute} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
}
