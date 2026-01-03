import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  orderBy,
  arrayUnion
} from 'firebase/firestore';
import { SOSRequest, Status, ChatMessage } from '../types';

// Configuration for project: bang-79e7b
const firebaseConfig = {
  apiKey: "AIzaSyCgvTNfyDnpCyLsJzqPX_M6TNLbLVb09so",
  authDomain: "bang-79e7b.firebaseapp.com",
  projectId: "bang-79e7b",
  storageBucket: "bang-79e7b.firebasestorage.app",
  messagingSenderId: "222566883468",
  appId: "1:222566883468:web:8ee2cf20cde7232cb91ba9",
  measurementId: "G-8JRL1RXHLY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Auth Service ---

export const AuthService = {
  login: (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass),
  signup: (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass),
  logout: () => signOut(auth),
  observeUser: (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback),
  currentUser: () => auth.currentUser
};

// --- Data Service ---

export const RescueStore = {
  subscribe: (callback: (data: SOSRequest[]) => void) => {
    // Listen to all requests, ordered by timestamp desc
    // Note: This requires a standard single-field index on 'timestamp', which Firestore creates automatically.
    const q = query(collection(db, 'sos_requests'), orderBy('timestamp', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SOSRequest[];
      callback(requests);
    }, (error) => {
       console.error("Firestore Listen Error:", error);
       // If this errors, it's usually because the Firestore Database hasn't been created in the Console 
       // or Security Rules are blocking access.
    });
  },

  addRequest: async (request: SOSRequest) => {
    // Remove ID as Firestore generates it. 
    // Ensure timestamp is a number (Date.now()) for sorting.
    const { id, ...data } = request;
    const docRef = await addDoc(collection(db, 'sos_requests'), {
        ...data,
        timestamp: Date.now() 
    });
    return docRef.id;
  },

  updateStatus: async (id: string, status: Status, rescuerId?: string, proofUrls?: string[]) => {
    const ref = doc(db, 'sos_requests', id);
    const updates: any = { status };
    
    if (rescuerId) {
        updates.rescuerId = rescuerId;
    }
    
    if (proofUrls) {
        updates.proofImageUrls = proofUrls;
    }

    if (status === Status.IN_PROGRESS) {
         // In a real app, this would be the rescuer's real GPS coords and phone profile
         updates.rescuerPhone = '+1-555-0999'; 
         // We don't update location here to keep it simple, 
         // but the app could write rescuerLocation to the doc periodically.
    }

    await updateDoc(ref, updates);
  },

  sendMessage: async (requestId: string, text: string, senderRole: 'VICTIM' | 'RESCUER') => {
    const ref = doc(db, 'sos_requests', requestId);
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderRole,
      text,
      timestamp: Date.now()
    };
    await updateDoc(ref, {
      messages: arrayUnion(newMessage)
    });
  },

  findRequestByPhone: async (phone: string): Promise<SOSRequest | null> => {
    // 1. Query by phone only to avoid needing complex composite indexes
    const q = query(collection(db, 'sos_requests'), where('contactPhone', '==', phone));
    
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        // 2. Filter and sort in memory (Client-side)
        // This is efficient enough for an MVP and avoids index configuration errors
        const requests = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as SOSRequest[];

        const activeRequests = requests
            .filter(r => r.status !== 'RESOLVED')
            .sort((a, b) => b.timestamp - a.timestamp); // Newest first

        return activeRequests.length > 0 ? activeRequests[0] : null;
    } catch (e) {
        console.error("Error finding request:", e);
        return null;
    }
  }
};