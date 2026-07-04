"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function emojiIcon(emoji: string, bg: string) {
  return L.divIcon({
    html: `<div style="background:${bg};width:30px;height:30px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 1px 4px rgba(0,0,0,.35);border:2px solid white;">${emoji}</div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function numberedIcon(n: number) {
  return L.divIcon({
    html: `<div style="background:#2e8aa8;color:#fff;width:26px;height:26px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;box-shadow:0 1px 4px rgba(0,0,0,.35);border:2px solid white;">${n}</div>`,
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

const truckIcon = emojiIcon("🚚", "#111827");
const pendingIcon = emojiIcon("🛢️", "#f3f4f6");

export interface MapPoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
  sub?: string;
}

interface RouteMapProps {
  pendingPoints: MapPoint[];
  routePoints: MapPoint[];
  onMapClick?: (lat: number, lng: number) => void;
  onPendingClick?: (id: string) => void;
  truckPosition?: { lat: number; lng: number } | null;
  heightClassName?: string;
}

export function RouteMap({
  pendingPoints,
  routePoints,
  onMapClick,
  onPendingClick,
  truckPosition,
  heightClassName = "h-80",
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);
  const onMapClickRef = useRef(onMapClick);
  const onPendingClickRef = useRef(onPendingClick);
  onMapClickRef.current = onMapClick;
  onPendingClickRef.current = onPendingClick;

  // تهيئة الخريطة مرة واحدة فقط، مع تنظيف كامل عند إلغاء التركيب
  // (Leaflet + StrictMode في وضع التطوير يحتاج تحكّم يدوي كامل بدورة حياة الخريطة)
  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
      [22.9, 57.8],
      7
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", (e) => onMapClickRef.current?.(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];

    const routeIds = new Set(routePoints.map((p) => p.id));
    const unselected = pendingPoints.filter((p) => !routeIds.has(p.id));

    unselected.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], { icon: pendingIcon })
        .addTo(map)
        .bindPopup(
          `<div style="text-align:right;direction:rtl"><strong>${p.label}</strong>${
            p.sub ? `<div>${p.sub}</div>` : ""
          }</div>`
        )
        .on("click", () => onPendingClickRef.current?.(p.id));
      layersRef.current.push(marker);
    });

    routePoints.forEach((p, i) => {
      const marker = L.marker([p.lat, p.lng], { icon: numberedIcon(i + 1) })
        .addTo(map)
        .bindPopup(
          `<div style="text-align:right;direction:rtl"><strong>${i + 1}. ${p.label}</strong></div>`
        );
      layersRef.current.push(marker);
    });

    if (routePoints.length > 1) {
      const line = L.polyline(
        routePoints.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#2e8aa8", weight: 4 }
      ).addTo(map);
      layersRef.current.push(line);
    }

    if (truckPosition) {
      const truck = L.marker([truckPosition.lat, truckPosition.lng], {
        icon: truckIcon,
      }).addTo(map);
      layersRef.current.push(truck);
    }
  }, [pendingPoints, routePoints, truckPosition]);

  return (
    <div
      ref={containerRef}
      className={`${heightClassName} w-full overflow-hidden rounded-2xl border border-neutral-200`}
    />
  );
}
