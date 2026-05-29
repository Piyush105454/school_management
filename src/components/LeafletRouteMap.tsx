"use client";

import { useEffect, useRef } from "react";

interface Stop {
  name: string;
  time?: string;
  lat: number;
  lng: number;
}

interface StudentPin {
  studentName: string;
  className: string;
  routeStop: string;
  busName?: string;
  locationName?: string;
  latitude: number;
  longitude: number;
}

interface LeafletRouteMapProps {
  stops: Stop[];
  students?: StudentPin[];
  centerLat?: number;
  centerLng?: number;
  height?: string;
  onStudentClick?: (student: StudentPin) => void;
}

export default function LeafletRouteMap({
  stops,
  students = [],
  centerLat = 23.2599,
  centerLng = 77.4126,
  height = "460px",
  onStudentClick,
}: LeafletRouteMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || instanceRef.current) return;

    // Dynamically import leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default marker icon paths (Next.js static asset issue)
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Compute map center from stops or use default
      const mapCenter: [number, number] =
        stops.length > 0
          ? [stops[0].lat || centerLat, stops[0].lng || centerLng]
          : [centerLat, centerLng];

      // Initialize map
      const map = L.map(containerRef.current!, {
        center: mapCenter,
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      });

      // Add OpenStreetMap tiles (free, no API key)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      instanceRef.current = map;
      mapRef.current = L;

      // Draw route polyline if we have stops
      if (stops.length > 1) {
        const latlngs: [number, number][] = stops.map((s) => [
          s.lat || centerLat,
          s.lng || centerLng,
        ]);

        L.polyline(latlngs, {
          color: "#db2777",
          weight: 4,
          opacity: 0.85,
          dashArray: undefined,
        }).addTo(map);
      }

      // Add stop markers
      stops.forEach((stop, idx) => {
        const isSchool = idx === 0;
        const lat = stop.lat || centerLat;
        const lng = stop.lng || centerLng;

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              background: ${isSchool ? "#3b82f6" : "#db2777"};
              border: 3px solid white;
              border-radius: 50%;
              width: ${isSchool ? "20px" : "14px"};
              height: ${isSchool ? "20px" : "14px"};
              box-shadow: 0 0 10px ${isSchool ? "rgba(59,130,246,0.7)" : "rgba(219,39,119,0.7)"};
              display: flex;
              align-items: center;
              justify-content: center;
            "></div>
          `,
          iconSize: [isSchool ? 20 : 14, isSchool ? 20 : 14],
          iconAnchor: [isSchool ? 10 : 7, isSchool ? 10 : 7],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: system-ui; min-width: 140px;">
            <p style="font-weight: 900; font-size: 12px; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.05em;">
              ${isSchool ? "🏫 " : "🚏 "}${stop.name}
            </p>
            ${stop.time ? `<p style="font-size: 10px; color: #64748b; margin: 0; font-weight: 700;">⏰ ${stop.time}</p>` : ""}
            <p style="font-size: 9px; color: #94a3b8; margin: 4px 0 0 0;">Stop #${idx + 1} on route</p>
          </div>
        `);
      });

      // Add student home pins (green markers)
      students.forEach((student) => {
        if (student.latitude && student.longitude) {
          const homeIcon = L.divIcon({
            className: "",
            html: `
              <div style="
                background: #10b981;
                border: 3px solid white;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                width: 16px;
                height: 16px;
                box-shadow: 0 0 8px rgba(16,185,129,0.8);
              "></div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 16],
          });

          const marker = L.marker([student.latitude, student.longitude], { icon: homeIcon }).addTo(map);
          marker.bindPopup(`
            <div style="font-family: system-ui; min-width: 160px;">
              <p style="font-weight: 900; font-size: 12px; color: #0f172a; margin: 0 0 4px 0;">🏠 ${student.studentName}</p>
              <p style="font-size: 10px; color: #64748b; margin: 0; font-weight: 700;">Class: ${student.className}</p>
              <p style="font-size: 10px; color: #db2777; margin: 3px 0 0 0; font-weight: 700;">Stop: ${student.routeStop}</p>
              ${student.locationName ? `<p style="font-size: 9px; color: #94a3b8; margin: 3px 0 0 0; font-style: italic;">${student.locationName}</p>` : ""}
              <p style="font-size: 9px; color: #94a3b8; margin: 3px 0 0 0; font-family: monospace;">📍 ${student.latitude.toFixed(5)}, ${student.longitude.toFixed(5)}</p>
            </div>
          `);

          if (onStudentClick) {
            marker.on("click", () => onStudentClick(student));
          }
        }
      });

      // Fit map bounds to all markers
      const allCoords: [number, number][] = [
        ...stops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng] as [number, number]),
        ...students.filter(s => s.latitude && s.longitude).map(s => [s.latitude, s.longitude] as [number, number]),
      ];
      if (allCoords.length > 1) {
        map.fitBounds(allCoords, { padding: [40, 40] });
      }
    });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map when stops/students change
  useEffect(() => {
    if (!instanceRef.current || !mapRef.current) return;
    const L = mapRef.current;
    const map = instanceRef.current;

    // Clear non-tile layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) return;
      layer.remove();
    });

    // Re-draw polyline
    if (stops.length > 1) {
      const latlngs: [number, number][] = stops.map((s) => [s.lat || centerLat, s.lng || centerLng]);
      L.polyline(latlngs, { color: "#db2777", weight: 4, opacity: 0.85 }).addTo(map);
    }

    // Re-add stop markers
    stops.forEach((stop, idx) => {
      const isSchool = idx === 0;
      const lat = stop.lat || centerLat;
      const lng = stop.lng || centerLng;

      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${isSchool ? "#3b82f6" : "#db2777"};border:3px solid white;border-radius:50%;width:${isSchool ? "20px" : "14px"};height:${isSchool ? "20px" : "14px"};box-shadow:0 0 10px ${isSchool ? "rgba(59,130,246,0.7)" : "rgba(219,39,119,0.7)"};"></div>`,
        iconSize: [isSchool ? 20 : 14, isSchool ? 20 : 14],
        iconAnchor: [isSchool ? 10 : 7, isSchool ? 10 : 7],
      });

      L.marker([lat, lng], { icon }).addTo(map).bindPopup(`
        <div style="font-family:system-ui;min-width:140px;">
          <p style="font-weight:900;font-size:12px;color:#0f172a;margin:0 0 4px 0;text-transform:uppercase;">${isSchool ? "🏫 " : "🚏 "}${stop.name}</p>
          ${stop.time ? `<p style="font-size:10px;color:#64748b;margin:0;font-weight:700;">⏰ ${stop.time}</p>` : ""}
        </div>
      `);
    });

    // Re-add student pins
    students.forEach((student) => {
      if (student.latitude && student.longitude) {
        const homeIcon = L.divIcon({
          className: "",
          html: `<div style="background:#10b981;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:16px;height:16px;box-shadow:0 0 8px rgba(16,185,129,0.8);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 16],
        });
        const m = L.marker([student.latitude, student.longitude], { icon: homeIcon }).addTo(map);
        m.bindPopup(`
          <div style="font-family:system-ui;min-width:160px;">
            <p style="font-weight:900;font-size:12px;color:#0f172a;margin:0 0 4px 0;">🏠 ${student.studentName}</p>
            <p style="font-size:10px;color:#64748b;margin:0;font-weight:700;">Class: ${student.className}</p>
            <p style="font-size:10px;color:#db2777;margin:3px 0 0 0;font-weight:700;">Stop: ${student.routeStop}</p>
            ${student.locationName ? `<p style="font-size:9px;color:#94a3b8;margin:3px 0 0 0;font-style:italic;">${student.locationName}</p>` : ""}
          </div>
        `);
        if (onStudentClick) m.on("click", () => onStudentClick(student));
      }
    });

    // Fit bounds again
    const allCoords: [number, number][] = [
      ...stops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng] as [number, number]),
      ...students.filter(s => s.latitude && s.longitude).map(s => [s.latitude, s.longitude] as [number, number]),
    ];
    if (allCoords.length > 1) {
      map.fitBounds(allCoords, { padding: [40, 40] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, students]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={containerRef}
        style={{ height, width: "100%", borderRadius: "inherit" }}
        className="z-0"
      />
    </>
  );
}
