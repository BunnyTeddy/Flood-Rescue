import { collection, getDocs, addDoc, getFirestore } from 'firebase/firestore';
import { MOCK_REQUESTS } from '../constants';

const db = getFirestore();

/**
 * Seeds the Firestore database with mock requests if it's empty.
 * Call this function once from the app to populate demo data.
 */
export async function seedDatabaseIfEmpty(): Promise<boolean> {
    try {
        const querySnapshot = await getDocs(collection(db, 'sos_requests'));

        if (querySnapshot.empty) {
            console.log('🌱 Database is empty. Seeding with mock data...');

            for (const request of MOCK_REQUESTS) {
                const { id, ...data } = request;
                await addDoc(collection(db, 'sos_requests'), {
                    ...data,
                    timestamp: Date.now() - Math.random() * 1000 * 60 * 60 // Random time within last hour
                });
            }

            console.log(`✅ Seeded ${MOCK_REQUESTS.length} mock requests!`);
            return true;
        } else {
            console.log(`📊 Database already has ${querySnapshot.size} requests. Skipping seed.`);
            return false;
        }
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        return false;
    }
}

/**
 * Forces re-seeding by clearing all existing requests first.
 * Use with caution - only for development!
 */
export async function forceSeedDatabase(): Promise<boolean> {
    try {
        console.log('🔄 Force seeding database...');

        for (const request of MOCK_REQUESTS) {
            const { id, ...data } = request;
            await addDoc(collection(db, 'sos_requests'), {
                ...data,
                timestamp: Date.now() - Math.random() * 1000 * 60 * 60
            });
        }

        console.log(`✅ Force seeded ${MOCK_REQUESTS.length} mock requests!`);
        return true;
    } catch (error) {
        console.error('❌ Error force seeding database:', error);
        return false;
    }
}

// Expose to window for easy manual seeding from browser console
// Usage: Open DevTools console and run: seedMockVictims()
if (typeof window !== 'undefined') {
    (window as any).seedMockVictims = forceSeedDatabase;
}
