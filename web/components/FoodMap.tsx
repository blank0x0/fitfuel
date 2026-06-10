"use client";
import { useEffect, useRef } from "react";

interface MapPlace {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface Props {
  lat: number;
  lon: number;
  places: MapPlace[];
}

export default function FoodMap({ lat, lon, places }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then(L => {
      if (instanceRef.current) {
        (instanceRef.current as { remove: () => void }).remove();
      }

      const map = L.map(mapRef.current!).setView([lat, lon], 14);
      instanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Center marker
      L.circleMarker([lat, lon], { radius: 8, color: "#10b981", fillColor: "#10b981", fillOpacity: 1 })
        .addTo(map)
        .bindPopup("Your location");

      // Place markers
      const storeIcon = L.divIcon({
        html: `<div style="background:#3b82f6;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">🛒</div>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const foodIcon = L.divIcon({
        html: `<div style="background:#f59e0b;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">🍽</div>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      places.forEach(p => {
        const isStore = p.tags.shop;
        const name = p.tags.name || (isStore ? "Grocery Store" : "Restaurant");
        const marker = L.marker([p.lat, p.lon], { icon: isStore ? storeIcon : foodIcon });
        marker.addTo(map).bindPopup(`<strong>${name}</strong><br/>${p.tags["addr:street"] || ""}`);
      });
    });

    return () => {
      if (instanceRef.current) {
        (instanceRef.current as { remove: () => void }).remove();
        instanceRef.current = null;
      }
    };
  }, [lat, lon, places]);

  return <div ref={mapRef} style={{ height: "360px", width: "100%", borderRadius: "12px", overflow: "hidden" }} />;
}
