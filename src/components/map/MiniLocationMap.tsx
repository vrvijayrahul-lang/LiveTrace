import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LocationCoordinate } from '@/types/location';

const recipientMarkerIcon = L.divIcon({
  className: 'recipient-marker-icon',
  html: `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.35);
        animation: radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: relative;
        z-index: 10;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #FFFFFF;
        border: 2.5px solid #10B981;
        box-shadow: 0 0 12px #10B981;
      "></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const MiniMapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    map.panTo(center, { animate: true });
  }, [center, map]);

  return null;
};

export const MiniLocationMap: React.FC<{ location: LocationCoordinate }> = ({ location }) => {
  const center: [number, number] = [location.latitude, location.longitude];

  return (
    <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-white/10 shadow-bezel-inner">
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
        <MiniMapController center={center} />
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
      <div className="absolute bottom-2 right-2 z-[400] text-[10px] text-slate-300 bg-dark-900/85 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
        Live Broadcast Preview
      </div>
    </div>
  );
};
