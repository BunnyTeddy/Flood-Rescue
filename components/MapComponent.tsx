import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { SOSRequest, Severity, Status, Location } from '../types';
import { MAP_CENTER_DEFAULT, ZOOM_LEVEL } from '../constants';

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const createIcon = (color: string, isRescuer = false) => new L.DivIcon({
  className: 'custom-icon',
  html: `<div style="background-color: ${color}; width: ${isRescuer ? 28 : 24}px; height: ${isRescuer ? 28 : 24}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">${isRescuer ? '<span style="font-size:16px;">🚑</span>' : ''}</div>`,
  iconSize: [isRescuer ? 28 : 24, isRescuer ? 28 : 24],
  iconAnchor: [12, 12]
});

const redIcon = createIcon('#ef4444'); // Critical
const orangeIcon = createIcon('#f97316'); // Supplies
const yellowIcon = createIcon('#eab308'); // In Progress
const greenIcon = createIcon('#22c55e'); // Resolved
const rescuerIcon = createIcon('#3b82f6', true); // Rescuer Blue

const RecenterMap = ({ location }: { location: Location }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([location.lat, location.lng], map.getZoom());
  }, [location, map]);
  return null;
};

interface MapComponentProps {
  requests: SOSRequest[];
  userLocation: Location | null;
  onMarkerClick: (req: SOSRequest) => void;
  selectedRequestId?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({ 
  requests, 
  userLocation, 
  onMarkerClick,
  selectedRequestId 
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-slate-900 animate-pulse" />;

  const getIcon = (req: SOSRequest) => {
    if (req.status === Status.RESOLVED) return greenIcon;
    if (req.status === Status.IN_PROGRESS || req.status === Status.PENDING_CONFIRMATION) return yellowIcon;
    return req.severity === Severity.CRITICAL ? redIcon : orangeIcon;
  };

  const selectedRequest = requests.find(r => r.id === selectedRequestId);
  
  // Logic to determine if we should show a route
  // A route exists if the request has a rescuerLocation and is active
  let routePositions: [number, number][] | null = null;
  let rescuerLoc: Location | undefined = undefined;

  if (selectedRequest && 
     (selectedRequest.status === Status.IN_PROGRESS || selectedRequest.status === Status.PENDING_CONFIRMATION)) {
      
      if (selectedRequest.rescuerLocation) {
          // Both points are known in the request object (Victim + Rescuer)
          routePositions = [
              [selectedRequest.rescuerLocation.lat, selectedRequest.rescuerLocation.lng],
              [selectedRequest.location.lat, selectedRequest.location.lng]
          ];
          rescuerLoc = selectedRequest.rescuerLocation;
      } 
  }

  return (
    <MapContainer 
      center={[MAP_CENTER_DEFAULT.lat, MAP_CENTER_DEFAULT.lng]} 
      zoom={ZOOM_LEVEL} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
      />

      {/* Dark overlay for map to match theme */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 400, backgroundColor: 'rgba(15, 23, 42, 0.3)' }}></div>

      {userLocation && (
        <>
          <Circle center={[userLocation.lat, userLocation.lng]} pathOptions={{ fillColor: '#3b82f6', color: '#3b82f6' }} radius={100} />
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={createIcon('#3b82f6')}
            zIndexOffset={100} // Lower z-index so SOS requests appear on top
          >
             <Popup>You are here</Popup>
          </Marker>
          <RecenterMap location={userLocation} />
        </>
      )}

      {/* Route Line */}
      {routePositions && (
        <Polyline 
            positions={routePositions} 
            pathOptions={{ color: '#eab308', weight: 4, dashArray: '10, 10', opacity: 0.8 }} 
        />
      )}

      {/* Rescuer Marker (Dynamic) */}
      {rescuerLoc && (
        <Marker position={[rescuerLoc.lat, rescuerLoc.lng]} icon={rescuerIcon} zIndexOffset={500}>
             <Popup>Rescuer Location</Popup>
        </Marker>
      )}

      {requests.map((req) => (
        <Marker
          key={req.id}
          position={[req.location.lat, req.location.lng]}
          icon={getIcon(req)}
          zIndexOffset={1000} // High z-index to ensure it sits ON TOP of the 'You are here' marker
          eventHandlers={{
            click: () => onMarkerClick(req),
          }}
        >
          {selectedRequestId === req.id && (
            <Popup offset={[0, -10]}>
              <div className="text-slate-900 font-bold">{req.contactName}</div>
              <div className="text-slate-700 text-xs">{req.severity}</div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
};