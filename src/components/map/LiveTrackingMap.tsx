import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle,
  Clock,
  Crosshair,
  Layers,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { formatCoordinates, formatRelativeTime, isLocationStale } from '@/lib/utils';
import type { LocationCoordinate } from '@/types/location';
import type { SessionStatus } from '@/types/session';

// Create a custom radar pulsing marker icon
const createRadarIcon = (isStale: boolean) => {
  return L.divIcon({
    className: 'custom-radar-wrapper',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${isStale ? 'rgba(245, 158, 11, 0.25)' : 'rgba(99, 102, 241, 0.35)'};
          animation: radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${isStale ? 'rgba(245, 158, 11, 0.6)' : 'rgba(99, 102, 241, 0.6)'};
          animation: pulseSubtle 1.8s ease-in-out infinite;
        "></div>
        <div style="
          position: relative;
          z-index: 10;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 3px solid ${isStale ? '#F59E0B' : '#6366F1'};
          box-shadow: 0 0 14px ${isStale ? '#F59E0B' : '#818CF8'};
        "></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Component to handle map center and smooth panning
const MapController: React.FC<{
  center: [number, number];
  _zoom?: number;
  follow: boolean;
}> = ({ center, follow }) => {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);

  useEffect(() => {
    if (follow) {
      const [lat, lng] = center;
      const [prevLat, prevLng] = prevCenterRef.current;
      if (lat !== prevLat || lng !== prevLng) {
        map.panTo(center, { animate: true, duration: 1 });
        prevCenterRef.current = center;
      }
    }
  }, [center, follow, map]);

  return null;
};

export interface LiveTrackingMapProps {
  location: LocationCoordinate | null;
  sessionStatus: SessionStatus;
  sessionTitle?: string;
  isSharingActive: boolean;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  location,
  sessionStatus,
  _sessionTitle,
  isSharingActive,
}: any) => {
  const [followLocation, setFollowLocation] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [tileMode, setTileMode] = useState<'dark' | 'standard'>('dark');
  const [, setStaleTick] = useState(0);

  // Periodic tick to check stale status every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStaleTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stale = location ? isLocationStale(location.capturedAt) : false;

  const defaultPos: [number, number] = [37.7749, -122.4194];
  const currentPos: [number, number] = location
    ? [location.latitude, location.longitude]
    : defaultPos;

  return (
    <div className="relative w-full h-[520px] rounded-[2rem] overflow-hidden bg-dark-900 border border-white/[0.09] shadow-bezel-outer">
      {/* Top Map Status Floating Island */}
      <div className="absolute top-4 inset-x-4 z-[400] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Telemetry pill */}
        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-dark-900/90 backdrop-blur-xl border border-white/10 shadow-bezel-inner text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                !isSharingActive
                  ? 'bg-slate-400'
                  : stale
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="font-semibold text-slate-200">
              {!isSharingActive
                ? 'Waiting for Recipient'
                : stale
                ? 'Signal Stale'
                : 'Live Signal Connected'}
            </span>
          </div>

          {location && (
            <>
              <span className="text-white/20">|</span>
              <span className="font-mono text-slate-300">
                {formatCoordinates(location.latitude, location.longitude)}
              </span>
              <span className="text-white/20">|</span>
              <span className="text-slate-400">±{Math.round(location.accuracy)}m</span>
            </>
          )}
        </div>

        {/* Map Control Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Tile theme toggle */}
          <button
            onClick={() => setTileMode((m) => (m === 'dark' ? 'standard' : 'dark'))}
            title="Toggle Map Style"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-900/90 backdrop-blur-xl border border-white/10 text-xs text-slate-300 hover:text-white hover:bg-dark-800 transition-colors shadow-bezel-inner"
          >
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">
              {tileMode === 'dark' ? 'Night View' : 'Standard View'}
            </span>
          </button>

          {/* Follow location toggle */}
          <button
            onClick={() => setFollowLocation(!followLocation)}
            title="Auto-center on recipient updates"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl border text-xs transition-colors shadow-bezel-inner ${
              followLocation
                ? 'bg-brand-600/30 text-brand-300 border-brand-500/40'
                : 'bg-dark-900/90 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <Crosshair className={`w-3.5 h-3.5 ${followLocation ? 'text-brand-400 animate-spin-slow' : ''}`} />
            <span>{followLocation ? 'Following' : 'Free Camera'}</span>
          </button>
        </div>
      </div>

      {/* Stale Location Alert Banner */}
      {location && stale && isSharingActive && (
        <div className="absolute top-16 left-4 right-4 z-[400] max-w-md mx-auto pointer-events-auto">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-950/80 backdrop-blur-lg border border-amber-500/30 shadow-bezel-outer text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold block">Location Signal Delay</span>
              <span className="text-amber-300/80">
                Last update was {formatRelativeTime(location.capturedAt)}. Device may be backgrounded or out of coverage.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State Overlay when waiting for recipient consent */}
      {!location && (
        <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center p-6 bg-dark-950/70 backdrop-blur-sm pointer-events-auto text-center">
          <div className="relative p-2 rounded-full bg-brand-500/10 border border-brand-500/20 mb-4">
            <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center text-brand-400">
              <MapPin className="w-6 h-6 animate-bounce" />
            </div>
            <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping opacity-40" />
          </div>
          <h4 className="text-lg font-bold text-slate-100 mb-1">
            {sessionStatus === 'pending'
              ? 'Awaiting Recipient Consent'
              : sessionStatus === 'stopped'
              ? 'Sharing Stopped by Recipient'
              : sessionStatus === 'revoked'
              ? 'Session Has Been Revoked'
              : 'Session Expired'}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
            {sessionStatus === 'pending'
              ? 'Share the tracking link with your recipient. Once they review the privacy terms and grant location permission, their live position will appear here.'
              : 'Live coordinates are only collected and rendered while the recipient maintains active browser consent.'}
          </p>
          <div className="flex items-center gap-2 text-xs text-brand-300 bg-brand-500/10 border border-brand-500/20 px-3.5 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span>Consent-based GPS architecture</span>
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={currentPos}
        zoom={location ? 15 : 12}
        scrollWheelZoom={true}
        className={`w-full h-full ${tileMode === 'dark' ? 'dark-map-tiles' : ''}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setTileError(true),
          }}
        />

        <MapController center={currentPos} follow={followLocation} />

        {location && (
          <>
            {/* Accuracy ring */}
            <Circle
              center={currentPos}
              radius={Math.max(location.accuracy, 20)}
              pathOptions={{
                color: stale ? '#F59E0B' : '#6366F1',
                weight: 1.5,
                dashArray: '5, 5',
                fillColor: stale ? '#F59E0B' : '#6366F1',
                fillOpacity: 0.12,
              }}
            />

            {/* Custom Radar Pulse Marker */}
            <Marker position={currentPos} icon={createRadarIcon(stale)} />
          </>
        )}
      </MapContainer>

      {/* Bottom Map Floating Bar */}
      {location && (
        <div className="absolute bottom-4 inset-x-4 z-[400] flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-dark-900/90 backdrop-blur-xl border border-white/10 text-xs text-slate-400 flex items-center gap-2 shadow-bezel-inner">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>Updated {formatRelativeTime(location.capturedAt)}</span>
          </div>

          <div className="pointer-events-auto text-[11px] text-slate-500 bg-dark-950/80 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-sm">
            OpenStreetMap
          </div>
        </div>
      )}

      {/* Fallback if tiles fail to load */}
      {tileError && (
        <div className="absolute bottom-4 left-4 z-[400] text-xs text-rose-400 bg-dark-900/90 p-2 rounded-xl border border-rose-500/30">
          Map tiles failed to load. Check network connection.
        </div>
      )}
    </div>
  );
};
