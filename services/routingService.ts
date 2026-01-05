import { Location } from '../types';

// OSRM Demo Server for road-aware routing
const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving';

export interface RouteResult {
    coordinates: [number, number][]; // [lat, lng] pairs
    distance: number; // meters
    duration: number; // seconds
}

/**
 * Fetch a road-aware route between two points using OSRM
 * @param origin Starting location
 * @param destination End location
 * @returns Array of coordinates following actual roads
 */
export const fetchRoute = async (
    origin: Location,
    destination: Location
): Promise<RouteResult | null> => {
    try {
        // OSRM uses lng,lat format (opposite of Leaflet's lat,lng)
        const url = `${OSRM_API_URL}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error('OSRM API error:', response.status);
            return null;
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            console.error('OSRM returned no route:', data);
            return null;
        }

        const route = data.routes[0];

        // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
        const coordinates: [number, number][] = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );

        return {
            coordinates,
            distance: route.distance,
            duration: route.duration
        };
    } catch (error) {
        console.error('Error fetching route:', error);
        return null;
    }
};

/**
 * Format distance in a human-readable way
 */
export const formatDistance = (meters: number): string => {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Format duration in a human-readable way
 */
export const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
        return `${Math.round(seconds)} sec`;
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
};
