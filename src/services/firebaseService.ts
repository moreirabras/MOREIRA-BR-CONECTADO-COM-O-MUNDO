import { db, auth } from '../lib/firebase.ts';
import { collection, doc, setDoc, getDoc, getDocs, Timestamp, query, where } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const FirebaseService = {
  // Authentication: Sign In
  async signIn(email: string, pass: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'auth/sign-in');
    }
  },

  // Authentication: Sign Up
  async signUp(email: string, pass: string): Promise<UserCredential> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      // Initialize user document in Firestore
      await this.saveUser(credential.user.uid, { email, displayName: email.split('@')[0], role: 'SUBSCRIBER' });
      return credential;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'auth/sign-up');
    }
  },

  // Users Collection
  async saveUser(userId: string, userData: { email: string; displayName?: string; role?: string }): Promise<void> {
    const path = `users/${userId}`;
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...userData,
        uid: userId,
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getUser(userId: string): Promise<any | null> {
    const path = `users/${userId}`;
    try {
      const userRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userRef);
      return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  // Transactions Collection
  async recordTransaction(txData: {
    id: string;
    userId: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    gateway: string;
    description: string;
  }): Promise<void> {
    const path = `transactions/${txData.id}`;
    try {
      const txRef = doc(db, 'transactions', txData.id);
      await setDoc(txRef, {
        ...txData,
        createdAt: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getTransactions(): Promise<any[]> {
    const path = 'transactions';
    try {
      const q = collection(db, 'transactions');
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getUserTransactions(userId: string): Promise<any[]> {
    const path = `transactions (user: ${userId})`;
    try {
      const q = query(collection(db, 'transactions'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
};
