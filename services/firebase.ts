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
  arrayUnion,
  setDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { SOSRequest, Status, ChatMessage, Location, RescuerProfile, VehicleType } from '../types';

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

  // Extended signup that also stores rescuer profile
  signupWithProfile: async (email: string, pass: string, name: string, phone: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    // Store rescuer profile in Firestore
    await setDoc(doc(db, 'rescuer_profiles', userCredential.user.uid), {
      name,
      phone,
      email,
      createdAt: Date.now()
    });
    return userCredential;
  },

  // Get rescuer profile by uid
  getRescuerProfile: async (uid: string): Promise<RescuerProfile | null> => {
    try {
      const docSnap = await getDoc(doc(db, 'rescuer_profiles', uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          vehicleType: data.vehicleType as VehicleType | undefined,
          passengerCapacity: data.passengerCapacity,
          createdAt: data.createdAt || Date.now()
        };
      }
      return null;
    } catch (e) {
      console.error('Error getting rescuer profile:', e);
      return null;
    }
  },

  // Update rescuer profile
  updateRescuerProfile: async (uid: string, updates: Partial<Omit<RescuerProfile, 'createdAt' | 'email'>>) => {
    try {
      const ref = doc(db, 'rescuer_profiles', uid);
      await updateDoc(ref, updates);
    } catch (e) {
      console.error('Error updating rescuer profile:', e);
      throw e;
    }
  },

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

  updateStatus: async (
    id: string,
    status: Status,
    rescuerId?: string,
    proofUrls?: string[],
    rescuerLocation?: Location,
    rescuerName?: string,
    rescuerPhone?: string
  ) => {
    const ref = doc(db, 'sos_requests', id);
    const updates: any = { status };

    if (rescuerId) {
      updates.rescuerId = rescuerId;
    }

    if (proofUrls) {
      updates.proofImageUrls = proofUrls;
    }

    if (rescuerLocation) {
      updates.rescuerLocation = rescuerLocation;
    }

    if (rescuerName) {
      updates.rescuerName = rescuerName;
    }

    if (rescuerPhone) {
      updates.rescuerPhone = rescuerPhone;
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
  },

  // Cancel a request (delete from database)
  cancelRequest: async (id: string) => {
    const ref = doc(db, 'sos_requests', id);
    await deleteDoc(ref);
  },

  // Update an existing request
  updateRequest: async (id: string, updates: Partial<Omit<SOSRequest, 'id' | 'timestamp' | 'status'>>) => {
    const ref = doc(db, 'sos_requests', id);
    await updateDoc(ref, updates);
  }
};