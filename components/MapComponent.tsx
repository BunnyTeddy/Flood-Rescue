import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { SOSRequest, Severity, Status, Location } from '../types';
import { MAP_CENTER_DEFAULT, ZOOM_LEVEL } from '../constants';
import { fetchRoute } from '../services/routingService';

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

// Pulsing icon for assigned victims (when rescue is in progress)
const createPulsingIcon = (color: string) => new L.DivIcon({
  className: 'custom-icon pulsing-marker',
  html: `
    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
      <div class="pulse-ring" style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background-color: ${color}; opacity: 0.4;"></div>
      <div class="pulse-ring pulse-ring-delay" style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background-color: ${color}; opacity: 0.4;"></div>
      <div style="position: relative; background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 20px ${color};"></div>
    </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const redIcon = createIcon('#ef4444'); // Critical
const orangeIcon = createIcon('#f97316'); // Supplies
const yellowIcon = createIcon('#eab308'); // In Progress
const greenIcon = createIcon('#22c55e'); // Resolved
const rescuerIcon = createIcon('#3b82f6', true); // Rescuer Blue

// Pulsing variants for in-progress rescues
const pulsingRedIcon = createPulsingIcon('#ef4444');
const pulsingOrangeIcon = createPulsingIcon('#f97316');

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
  const [roadRoute, setRoadRoute] = useState<[number, number][] | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getIcon = (req: SOSRequest, isAssignedVictim: boolean = false) => {
    if (req.status === Status.RESOLVED) return greenIcon;
    if (req.status === Status.IN_PROGRESS || req.status === Status.PENDING_CONFIRMATION) {
      // Use pulsing icon for the victim being rescued
      if (isAssignedVictim) {
        return req.severity === Severity.CRITICAL ? pulsingRedIcon : pulsingOrangeIcon;
      }
      return yellowIcon;
    }
    return req.severity === Severity.CRITICAL ? redIcon : orangeIcon;
  };

  // Find the active request with rescuer location (for both victim and rescuer views)
  const activeRequest = requests.find(r =>
    (r.status === Status.IN_PROGRESS || r.status === Status.PENDING_CONFIRMATION) &&
    r.rescuerLocation
  );

  // Selected request for highlighting
  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  // Determine which request to show route for
  const routeRequest = selectedRequest?.rescuerLocation ? selectedRequest : activeRequest;

  // Fetch road-aware route when route request changes
  useEffect(() => {
    if (routeRequest?.rescuerLocation) {
      const origin = routeRequest.rescuerLocation;
      const destination = routeRequest.location;

      setIsLoadingRoute(true);
      fetchRoute(origin, destination)
        .then(result => {
          if (result) {
            setRoadRoute(result.coordinates);
          } else {
            // Fallback to straight line
            setRoadRoute([
              [origin.lat, origin.lng],
              [destination.lat, destination.lng]
            ]);
          }
        })
        .finally(() => setIsLoadingRoute(false));
    } else {
      setRoadRoute(null);
    }
  }, [routeRequest?.id, routeRequest?.rescuerLocation?.lat, routeRequest?.rescuerLocation?.lng]);

  if (!mounted) return <div className="h-full w-full bg-slate-900 animate-pulse" />;

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

      {/* Route Line (Road-aware) */}
      {roadRoute && (
        <Polyline
          positions={roadRoute}
          pathOptions={{
            color: '#3b82f6',
            weight: 6,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round'
          }}
        />
      )}

      {/* Rescuer Marker (Dynamic) */}
      {routeRequest?.rescuerLocation && (
        <Marker position={[routeRequest.rescuerLocation.lat, routeRequest.rescuerLocation.lng]} icon={rescuerIcon} zIndexOffset={500}>
          <Popup>Rescuer Location</Popup>
        </Marker>
      )}

      {requests.map((req) => {
        // Pulsing for the victim being rescued - works for both victim and rescuer views
        const isAssignedVictim = routeRequest?.id === req.id &&
          (req.status === Status.IN_PROGRESS || req.status === Status.PENDING_CONFIRMATION);

        // Helper to format time ago
        const getTimeAgo = (timestamp: number) => {
          const minutes = Math.floor((Date.now() - timestamp) / 60000);
          if (minutes < 1) return 'Just now';
          if (minutes < 60) return `${minutes}m ago`;
          const hours = Math.floor(minutes / 60);
          if (hours < 24) return `${hours}h ago`;
          return `${Math.floor(hours / 24)}d ago`;
        };

        // Severity color mapping
        const getSeverityColor = (severity: Severity) => {
          switch (severity) {
            case Severity.CRITICAL: return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
            case Severity.SUPPLIES: return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' };
            default: return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
          }
        };

        // Status color mapping
        const getStatusInfo = (status: Status) => {
          switch (status) {
            case Status.OPEN: return { label: 'Awaiting Rescue', color: '#ef4444' };
            case Status.IN_PROGRESS: return { label: 'Rescue In Progress', color: '#eab308' };
            case Status.PENDING_CONFIRMATION: return { label: 'Pending Confirmation', color: '#3b82f6' };
            case Status.RESOLVED: return { label: 'Rescued', color: '#22c55e' };
            default: return { label: 'Unknown', color: '#94a3b8' };
          }
        };

        const sevColors = getSeverityColor(req.severity);
        const statusInfo = getStatusInfo(req.status);

        return (
          <Marker
            key={req.id}
            position={[req.location.lat, req.location.lng]}
            icon={getIcon(req, isAssignedVictim)}
            zIndexOffset={isAssignedVictim ? 1500 : 1000} // Higher z-index for assigned victim
          >
            <Popup offset={[0, -10]} className="victim-info-popup">
              <div style={{ minWidth: '220px', maxWidth: '280px', fontFamily: 'system-ui, sans-serif' }}>
                {/* Header with name and time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{req.contactName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{getTimeAgo(req.timestamp)}</div>
                </div>

                {/* Severity badge */}
                <div style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: sevColors.bg,
                  color: sevColors.text,
                  border: `1px solid ${sevColors.border}`,
                  marginBottom: '10px'
                }}>
                  {req.severity}
                </div>

                {/* Status indicator */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '10px',
                  fontSize: '13px',
                  color: statusInfo.color
                }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: statusInfo.color,
                    boxShadow: `0 0 8px ${statusInfo.color}80`
                  }}></span>
                  <span style={{ fontWeight: '600' }}>{statusInfo.label}</span>
                </div>

                {/* Phone - clickable */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                  padding: '8px 10px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}>
                  <span style={{ fontSize: '16px' }}>📞</span>
                  <a href={`tel:${req.contactPhone}`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
                    {req.contactPhone}
                  </a>
                </div>

                {/* Note excerpt */}
                {req.note && (
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#475569',
                    fontStyle: 'italic',
                    borderLeft: '4px solid #3b82f6',
                    marginBottom: '12px'
                  }}>
                    "{req.note.length > 100 ? req.note.substring(0, 100) + '...' : req.note}"
                  </div>
                )}

                {/* View Full Details Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkerClick(req);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                >
                  <span>👁️</span> View Full Details & Actions
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};