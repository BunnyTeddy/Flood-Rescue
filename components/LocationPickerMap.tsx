import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Location } from '../types';
import { MapPin, Loader2 } from 'lucide-react';

// Red draggable marker icon
const locationIcon = new L.DivIcon({
    className: 'custom-icon',
    html: `<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); cursor: grab;"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

interface DraggableMarkerProps {
    position: Location;
    onPositionChange: (loc: Location) => void;
}

const DraggableMarker: React.FC<DraggableMarkerProps> = ({ position, onPositionChange }) => {
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const latlng = marker.getLatLng();
                    onPositionChange({ lat: latlng.lat, lng: latlng.lng });
                }
            },
        }),
        [onPositionChange]
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[position.lat, position.lng]}
            ref={markerRef}
            icon={locationIcon}
        />
    );
};

// Component to handle map click events
const MapClickHandler: React.FC<{ onLocationChange: (loc: Location) => void }> = ({ onLocationChange }) => {
    useMapEvents({
        click(e) {
            onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
};

// Recenter map when location changes
const RecenterMap: React.FC<{ location: Location }> = ({ location }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([location.lat, location.lng], 16);
    }, [location.lat, location.lng, map]);
    return null;
};

interface LocationPickerMapProps {
    initialLocation: Location | null;
    onLocationChange: (location: Location, address: string) => void;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
    initialLocation,
    onLocationChange,
}) => {
    const [position, setPosition] = useState<Location | null>(initialLocation);
    const [address, setAddress] = useState<string>('Fetching address...');
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);

    // Update position when initialLocation changes
    useEffect(() => {
        if (initialLocation && !position) {
            setPosition(initialLocation);
        }
    }, [initialLocation, position]);

    // Reverse geocoding using Nominatim
    const fetchAddress = async (loc: Location) => {
        setIsLoadingAddress(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'en',
                    },
                }
            );
            const data = await response.json();
            const displayName = data.display_name || `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;
            setAddress(displayName);
            onLocationChange(loc, displayName);
        } catch (error) {
            console.error('Error fetching address:', error);
            const fallbackAddress = `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;
            setAddress(fallbackAddress);
            onLocationChange(loc, fallbackAddress);
        } finally {
            setIsLoadingAddress(false);
        }
    };

    // Fetch address when position changes
    useEffect(() => {
        if (position) {
            fetchAddress(position);
        }
    }, [position?.lat, position?.lng]);

    const handlePositionChange = (loc: Location) => {
        setPosition(loc);
    };

    if (!position) {
        return (
            <div className="h-48 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                <Loader2 className="animate-spin mr-2" size={20} />
                Waiting for GPS location...
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Address Display */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-start gap-2">
                <MapPin className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                <div className="flex-1 min-w-0">
                    {isLoadingAddress ? (
                        <div className="flex items-center gap-2 text-slate-400">
                            <Loader2 className="animate-spin" size={14} />
                            <span className="text-sm">Fetching address...</span>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-300 break-words">{address}</p>
                    )}
                </div>
            </div>

            {/* Map */}
            <div className="h-48 rounded-xl overflow-hidden border-2 border-slate-700 relative">
                <MapContainer
                    center={[position.lat, position.lng]}
                    zoom={16}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* Dark overlay */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 400, backgroundColor: 'rgba(15, 23, 42, 0.3)' }}></div>

                    <DraggableMarker position={position} onPositionChange={handlePositionChange} />
                    <MapClickHandler onLocationChange={handlePositionChange} />
                    <RecenterMap location={position} />
                </MapContainer>

                {/* Instructions overlay */}
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-[500] text-center">
                    Drag marker or tap map to adjust location
                </div>
            </div>
        </div>
    );
};
