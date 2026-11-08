import { db } from './firebaseClient.ts';
import { doc, setDoc, getDoc, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { TenantSubscriberProfile } from './TenantService.ts';

export const FirestorePersistenceService = {
  // Save or update tenant subscriber profile in Firestore
  async saveTenantProfile(profile: TenantSubscriberProfile): Promise<void> {
    try {
      const tenantRef = doc(db, 'tenants', profile.id);
      await setDoc(tenantRef, {
        ...profile,
        lastSyncedAt: Timestamp.now()
      }, { merge: true });
      
      // Also cache in localStorage for immediate offline resilience
      localStorage.setItem('vortex_subscriber_profile', JSON.stringify(profile));
    } catch (error) {
      console.warn('Firestore tenant save fallback to localStorage:', error);
      localStorage.setItem('vortex_subscriber_profile', JSON.stringify(profile));
    }
  },

  // Get tenant subscriber profile from Firestore
  async getTenantProfile(tenantId: string): Promise<TenantSubscriberProfile | null> {
    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      const snapshot = await getDoc(tenantRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as TenantSubscriberProfile;
        localStorage.setItem('vortex_subscriber_profile', JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.warn('Firestore tenant get fallback to localStorage:', error);
    }

    const saved = localStorage.getItem('vortex_subscriber_profile');
    return saved ? JSON.parse(saved) : null;
  },

  // Log transaction record to Firestore
  async recordTransaction(transaction: {
    id: string;
    userId: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    gateway: string;
    description: string;
  }): Promise<void> {
    try {
      const txRef = doc(db, 'transactions', transaction.id);
      await setDoc(txRef, {
        ...transaction,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.warn('Firestore transaction recording fallback:', error);
    }
  },

  // Get recent transactions from Firestore
  async getTransactions(): Promise<any[]> {
    try {
      const txCollection = collection(db, 'transactions');
      const snapshot = await getDocs(txCollection);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.warn('Firestore get transactions fallback:', error);
      return [];
    }
  }
};
