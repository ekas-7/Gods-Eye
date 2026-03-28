"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    function initMap(lng: number, lat: number) {
      if (!containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        // OpenFreeMap Liberty style — free, no token needed
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [lng, lat],
        zoom: 15.5,
        pitch: 60,
        bearing: -20,
        antialias: true,
      });

      mapRef.current = map;

      map.on("load", () => {
        // 3D buildings from the vector tile source
        map.addLayer({
          id: "3d-buildings",
          source: "openmaptiles",
          "source-layer": "building",
          type: "fill-extrusion",
          minzoom: 13,
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["zoom"],
              13, "#0d0d1a",
              16, "#1a1a2e",
            ],
            "fill-extrusion-height": ["get", "render_height"],
            "fill-extrusion-base": ["get", "render_min_height"],
            "fill-extrusion-opacity": 0.9,
          },
        });
      });

      // Pulse marker for user location
      const el = document.createElement("div");
      el.className = "user-location-marker";
      el.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 0 0 4px rgba(255,255,255,0.2), 0 0 20px rgba(255,255,255,0.4);
        position: relative;
      `;

      // Outer pulse ring
      const pulse = document.createElement("div");
      pulse.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1.5px solid rgba(255,255,255,0.5);
        animation: pulse-ring 2s ease-out infinite;
      `;
      el.appendChild(pulse);

      // Inject keyframes once
      if (!document.getElementById("map-pulse-style")) {
        const style = document.createElement("style");
        style.id = "map-pulse-style";
        style.textContent = `
          @keyframes pulse-ring {
            0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 1; }
            100% { transform: translate(-50%,-50%) scale(2);   opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

      map.addControl(new maplibregl.NavigationControl(), "top-right");
    }

    if (!navigator.geolocation) {
      setError("Geolocation not supported — showing default view.");
      initMap(77.5946, 12.9716); // Bengaluru fallback
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => initMap(pos.coords.longitude, pos.coords.latitude),
      () => {
        setError("Location access denied — showing default view.");
        initMap(77.5946, 12.9716);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/40 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full pointer-events-none">
          {error}
        </div>
      )}
    </div>
  );
}
