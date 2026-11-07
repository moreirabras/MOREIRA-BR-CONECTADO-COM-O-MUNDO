import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * CONFIGURAÇÃO DO FIREBASE ADMIN SDK
 * ----------------------------------
 * Utiliza as credenciais do Service Account para auditoria e backup
 * de longo prazo em Firestore, além do SQL primário.
 */

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length && firebaseConfig.projectId && firebaseConfig.privateKey) {
  initializeApp({
    credential: cert(firebaseConfig),
  });
}

export const firestoreAdmin = getFirestore();
