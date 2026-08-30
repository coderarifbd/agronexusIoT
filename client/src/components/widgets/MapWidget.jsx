import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Cpu, Wifi, Battery, MapPin } from "lucide-react";

// Fix standard Leaflet default icon bug in React
const customIcon = (isOnline) =>
  new L.DivIcon({
    className: "custom-marker-pin",
    html: `
      <div style="
        background-color: ${isOnline ? "#10B981" : "#EF4444"};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 0 12px ${isOnline ? "rgba(16, 185, 129, 0.8)" : "rgba(239, 68, 68, 0.8)"};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; background-color: #fff; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

export function MapWidget({ devices = [] }) {
  const defaultCenter = [23.8103, 90.4125];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-bold text-white tracking-tight">IoT Devices Fleet Map</h4>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {devices.length} Microcontrollers Deployed
        </span>
      </div>

      <div className="flex-1 w-full min-h-[260px] rounded-xl overflow-hidden border border-slate-800 relative z-10">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", background: "#0b0f19" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {devices.map((dev) => {
            const lat = dev.latitude || 23.8103;
            const lng = dev.longitude || 90.4125;
            const isOnline = dev.status === "online";

            return (
              <Marker key={dev.id} position={[lat, lng]} icon={customIcon(isOnline)}>
                <Popup>
                  <div className="text-slate-900 font-sans p-1 text-xs">
                    <div className="font-bold text-sm text-slate-900">{dev.name}</div>
                    <div className="font-mono text-emerald-600 font-semibold mb-1">{dev.device_id_code}</div>
                    <div className="text-slate-600">Location: {dev.location_name || "Primary Mast"}</div>
                    <div className="mt-1 pt-1 border-t border-slate-200 flex items-center justify-between text-[10px]">
                      <span>Battery: {dev.battery_level}%</span>
                      <span>Signal: {dev.wifi_rssi} dBm</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
