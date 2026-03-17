"use client";

import { Eye } from "lucide-react";

export default function ViewDocumentButton({ url }: { url: string }) {
  const handleViewPdf = () => {
    if (url) {
      if (url.startsWith("data:application/pdf")) {
        const base64Data = url.split(",")[1];
        const byteCharacters = window.atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, "_blank");
      } else {
        window.open(url, "_blank");
      }
    }
  };

  return (
    <button
      onClick={handleViewPdf}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all flex items-center gap-2"
    >
      <Eye size={14} /> View
    </button>
  );
}
