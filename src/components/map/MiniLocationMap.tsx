import React from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { LocationCoordinate } from '@/types/location';

const recipientMarkerIcon = L.divIcon({
  className: 'recipient-marker-icon',
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.35);
        animation: radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: relative;
        z-index: 10;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #FFFFFF;
        border: 2px solid #10B981;
        box-shadow: 0 0 10px #10B981;
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export const MiniLocationMap: React.FC<{ location: LocationCoordinate }> = ({ location }) => {
  const center: [number, number] = [location.latitude, location.longitude];

  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-white/10 shadow-bezel-inner">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={false}
        className="w-full h-full dark-map-tiles"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={center}
          radius={Math.max(location.accuracy, 15)}
          pathOptions={{
            color: '#10B981',
            weight: 1.5,
            fillColor: '#10B981',
            fillOpacity: 0.15,
          }}
        />
        <Marker position={center} icon={recipientMarkerIcon} />
      </MapContainer>
      <div className="absolute bottom-2 right-2 z-[400] text-[10px] text-slate-400 bg-dark-900/80 px-2 py-0.5 rounded backdrop-blur-sm">
        Your broadcasted location
      </div>
    </div>
  );
};
