export enum Severity {
  CRITICAL = 'CRITICAL', // Life-threatening
  SUPPLIES = 'SUPPLIES', // Food, water needed
  OK = 'OK'
}

export enum Status {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION', // Rescuer says done, waiting for victim
  RESOLVED = 'RESOLVED'
}

export interface Location {
  lat: number;
  lng: number;
}

export interface ChatMessage {
  id: string;
  senderRole: 'VICTIM' | 'RESCUER';
  text: string;
  timestamp: number;
}

export interface SOSRequest {
  id: string;
  contactName: string;
  contactPhone: string;
  location: Location;
  severity: Severity;
  status: Status;
  note: string;
  timestamp: number;
  rescuerId?: string;
  rescuerPhone?: string;
  rescuerLocation?: Location;
  proofImageUrls?: string[]; // Changed to array
  requestImageUrls?: string[]; // Changed to array
  messages: ChatMessage[];
}

export enum UserRole {
  VICTIM = 'VICTIM',
  RESCUER = 'RESCUER'
}

export interface AIAnalysisResult {
  riskLevel: string;
  recommendedGear: string[];
  hazards: string[];
}