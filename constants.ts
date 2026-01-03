import { SOSRequest, Severity, Status } from './types';

export const APP_NAME = "FloodRescue";

// Mock initial data centered around a hypothetical flood zone
export const MOCK_REQUESTS: SOSRequest[] = [
  {
    id: 'req-001',
    contactName: 'Sarah Johnson',
    contactPhone: '+1-555-0123',
    location: { lat: 34.0522, lng: -118.2437 },
    severity: Severity.CRITICAL,
    status: Status.OPEN,
    note: 'Trapped on roof, 2 elderly, water rising fast.',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    messages: [],
    requestImageUrls: []
  },
  {
    id: 'req-002',
    contactName: 'Mike Chen',
    contactPhone: '+1-555-0199',
    location: { lat: 34.0535, lng: -118.2450 },
    severity: Severity.SUPPLIES,
    status: Status.OPEN,
    note: 'Need clean water and insulin.',
    timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
    messages: [],
    requestImageUrls: []
  },
  {
    id: 'req-003',
    contactName: 'Emily Davis',
    contactPhone: '+1-555-0255',
    location: { lat: 34.0490, lng: -118.2500 },
    severity: Severity.CRITICAL,
    status: Status.IN_PROGRESS,
    note: 'Power outage, medical ventilator needs battery.',
    timestamp: Date.now() - 1000 * 60 * 15, // 15 mins ago
    rescuerId: 'rescuer-1',
    messages: [],
    requestImageUrls: []
  },
];

export const MAP_CENTER_DEFAULT = { lat: 34.0522, lng: -118.2437 }; // LA Example
export const ZOOM_LEVEL = 15;