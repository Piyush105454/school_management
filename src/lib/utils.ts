import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  try {
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
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
