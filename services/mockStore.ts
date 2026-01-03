import { SOSRequest, Status, ChatMessage, UserRole } from '../types';
import { MOCK_REQUESTS } from '../constants';

// Simple in-memory store simulating Firestore for MVP
let requests: SOSRequest[] = MOCK_REQUESTS.map(req => ({...req, messages: []})); // Ensure mocks have message arrays
const listeners: ((data: SOSRequest[]) => void)[] = [];

const notifyListeners = () => {
  listeners.forEach(l => l([...requests]));
};

export const MockStore = {
  subscribe: (callback: (data: SOSRequest[]) => void) => {
    listeners.push(callback);
    callback([...requests]);
    return () => {
      const idx = listeners.indexOf(callback);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  },

  addRequest: (request: SOSRequest) => {
    // Ensure new requests have empty message array
    requests.push({ ...request, messages: [] });
    notifyListeners();
  },

  updateStatus: (id: string, status: Status, rescuerId?: string, proofUrls?: string[]) => {
    requests = requests.map(req => {
      if (req.id === id) {
        // Mocking Rescuer Data when they click "I'm Going"
        const isAccepting = status === Status.IN_PROGRESS && req.status === Status.OPEN;
        
        return {
          ...req,
          status,
          rescuerId: rescuerId || req.rescuerId,
          proofImageUrls: proofUrls || req.proofImageUrls,
          // If accepting, set a mock rescuer location (slightly offset from victim) and phone
          rescuerLocation: isAccepting ? { lat: req.location.lat + 0.002, lng: req.location.lng + 0.002 } : req.rescuerLocation,
          rescuerPhone: isAccepting ? '+1-999-888-7777' : req.rescuerPhone
        };
      }
      return req;
    });
    notifyListeners();
  },

  sendMessage: (requestId: string, text: string, senderRole: 'VICTIM' | 'RESCUER') => {
    requests = requests.map(req => {
        if (req.id === requestId) {
            const newMessage: ChatMessage = {
                id: `msg-${Date.now()}`,
                senderRole,
                text,
                timestamp: Date.now()
            };
            return { ...req, messages: [...req.messages, newMessage] };
        }
        return req;
    });
    notifyListeners();
  },

  findRequestByPhone: (phone: string) => {
    // Return the most recent active request for this phone
    return requests
        .filter(r => r.contactPhone === phone && r.status !== Status.RESOLVED)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
  },

  getRequests: () => [...requests]
};