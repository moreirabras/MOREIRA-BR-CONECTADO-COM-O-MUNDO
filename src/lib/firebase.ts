import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicializa a aplicação Firebase usando as credenciais do firebase-applet-config.json
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Instâncias de banco de dados (Firestore com ID dedicado) e autenticação
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test connection on boot (manually called or via side effect)
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase is offline. Check your network or configuration.");
    }
  }
}

export { app };
export default app;
