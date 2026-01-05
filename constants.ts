import { SOSRequest, Severity, Status } from './types';

export const APP_NAME = "FloodRescue";

// Vehicle types for rescuer profile
export const VEHICLE_TYPES: Record<string, { label: string; emoji: string }> = {
  BOAT: { label: 'Boat', emoji: '🚤' },
  CANOE: { label: 'Canoe/Kayak', emoji: '🛶' },
  HELICOPTER: { label: 'Helicopter', emoji: '🚁' },
  TRUCK: { label: 'Truck', emoji: '🚚' },
  MOTORCYCLE: { label: 'Motorcycle', emoji: '🏍️' },
  ON_FOOT: { label: 'On Foot', emoji: '🚶' },
  OTHER: { label: 'Other', emoji: '🚗' },
};

// Mock initial data centered around Ho Chi Minh City, Vietnam flood zones
export const MOCK_REQUESTS: SOSRequest[] = [
  // CRITICAL - Binh Thanh District (Flood-prone area near Nhieu Loc canal)
  {
    id: 'req-001',
    contactName: 'Michael Chen',
    contactPhone: '+84-909-123-456',
    location: { lat: 10.8031, lng: 106.7094 },
    severity: Severity.CRITICAL,
    status: Status.OPEN,
    note: 'Trapped on rooftop, 3 elderly and 1 child. Water rising fast!',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
    messages: [],
    requestImageUrls: []
  },
  // CRITICAL - Thu Duc City (Near Saigon River)
  {
    id: 'req-002',
    contactName: 'Sarah Williams',
    contactPhone: '+84-912-345-678',
    location: { lat: 10.8544, lng: 106.7549 },
    severity: Severity.CRITICAL,
    status: Status.OPEN,
    note: 'Family of 5 trapped, heart patient needs emergency care.',
    timestamp: Date.now() - 1000 * 60 * 12, // 12 mins ago
    messages: [],
    requestImageUrls: []
  },
  // CRITICAL - District 7 (Phu My Hung area)
  {
    id: 'req-003',
    contactName: 'Lê Hoàng Nam',
    contactPhone: '+84-903-567-890',
    location: { lat: 10.7296, lng: 106.7219 },
    severity: Severity.CRITICAL,
    status: Status.IN_PROGRESS,
    note: 'Power out, ventilator needs batteries urgently. 2 patients.',
    timestamp: Date.now() - 1000 * 60 * 8, // 8 mins ago
    rescuerId: 'rescuer-1',
    rescuerPhone: '+84-938-111-222',
    rescuerLocation: { lat: 10.7350, lng: 106.7150 },
    messages: [
      { id: 'msg-1', senderRole: 'RESCUER', text: 'Đang trên đường đến, khoảng 10 phút nữa!', timestamp: Date.now() - 1000 * 60 * 3 }
    ],
    requestImageUrls: []
  },
  // SUPPLIES - Binh Chanh District
  {
    id: 'req-004',
    contactName: 'Emily Johnson',
    contactPhone: '+84-908-234-567',
    location: { lat: 10.7012, lng: 106.6087 },
    severity: Severity.SUPPLIES,
    status: Status.OPEN,
    note: 'Need clean water and milk for children. Trapped for 2 days.',
    timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
    messages: [],
    requestImageUrls: []
  },
  // CRITICAL - Go Vap District  
  {
    id: 'req-005',
    contactName: 'Võ Minh Tuấn',
    contactPhone: '+84-915-678-901',
    location: { lat: 10.8387, lng: 106.6650 },
    severity: Severity.CRITICAL,
    status: Status.OPEN,
    note: 'House partially collapsed, seriously injured person needs emergency!',
    timestamp: Date.now() - 1000 * 60 * 3, // 3 mins ago - NEW
    messages: [],
    requestImageUrls: []
  },
  // SUPPLIES - District 9 (Hi-Tech Park area)
  {
    id: 'req-006',
    contactName: 'David Park',
    contactPhone: '+84-918-901-234',
    location: { lat: 10.8650, lng: 106.8200 },
    severity: Severity.SUPPLIES,
    status: Status.OPEN,
    note: 'Need diabetes medication and food for 8 people.',
    timestamp: Date.now() - 1000 * 60 * 90, // 1.5 hours ago
    messages: [],
    requestImageUrls: []
  },
  // CRITICAL - District 12 (Near Tan Thuan canal)
  {
    id: 'req-007',
    contactName: 'Huỳnh Văn Đức',
    contactPhone: '+84-906-345-678',
    location: { lat: 10.8676, lng: 106.6412 },
    severity: Severity.CRITICAL,
    status: Status.OPEN,
    note: '8-month pregnant woman, needs emergency evacuation!',
    timestamp: Date.now() - 1000 * 60 * 7, // 7 mins ago
    messages: [],
    requestImageUrls: []
  },
  // SUPPLIES - Tan Phu District
  {
    id: 'req-008',
    contactName: 'Bùi Thị Lan',
    contactPhone: '+84-907-456-789',
    location: { lat: 10.7919, lng: 106.6287 },
    severity: Severity.SUPPLIES,
    status: Status.OPEN,
    note: 'Thiếu nước uống và đèn pin. Có 4 trẻ nhỏ.',
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    messages: [],
    requestImageUrls: []
  },
  // CRITICAL - District 4 (Very flood-prone)
  {
    id: 'req-009',
    contactName: 'James Rodriguez',
    contactPhone: '+84-919-567-890',
    location: { lat: 10.7585, lng: 106.7050 },
    severity: Severity.CRITICAL,
    status: Status.OPEN,
    note: 'Chest-high water, 2 elderly cannot move!',
    timestamp: Date.now() - 1000 * 60 * 10, // 10 mins ago
    messages: [],
    requestImageUrls: []
  },
  // SUPPLIES - District 2 (Thu Thiem area)
  {
    id: 'req-010',
    contactName: 'Dương Minh Châu',
    contactPhone: '+84-902-678-901',
    location: { lat: 10.7891, lng: 106.7453 },
    severity: Severity.SUPPLIES,
    status: Status.OPEN,
    note: 'Cần bình gas nấu ăn và chăn mền. Đã mất điện 3 ngày.',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    messages: [],
    requestImageUrls: []
  },
  // CRITICAL - Binh Tan District
  {
    id: 'req-011',
    contactName: 'Phan Thanh Sơn',
    contactPhone: '+84-913-789-012',
    location: { lat: 10.7654, lng: 106.5987 },
    severity: Severity.CRITICAL,
    status: Status.OPEN,
    note: '3-year-old with high fever, needs medication and hospital transport!',
    timestamp: Date.now() - 1000 * 60 * 2, // 2 mins ago - VERY NEW
    messages: [],
    requestImageUrls: []
  },
  // SUPPLIES - Nha Be District
  {
    id: 'req-012',
    contactName: 'Mai Thị Ngọc',
    contactPhone: '+84-920-890-123',
    location: { lat: 10.6654, lng: 106.7321 },
    severity: Severity.SUPPLIES,
    status: Status.PENDING_CONFIRMATION,
    note: 'Need dry food and drinking water for 12 people.',
    timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
    rescuerId: 'rescuer-2',
    rescuerPhone: '+84-939-222-333',
    messages: [
      { id: 'msg-2', senderRole: 'RESCUER', text: 'Đã giao hàng tiếp tế. Xin xác nhận!', timestamp: Date.now() - 1000 * 60 * 5 }
    ],
    requestImageUrls: []
  },
];

// Ho Chi Minh City center coordinates (Ben Thanh Market area)
export const MAP_CENTER_DEFAULT = { lat: 10.7756, lng: 106.7019 };
export const ZOOM_LEVEL = 12; // Wider zoom to see more of the city