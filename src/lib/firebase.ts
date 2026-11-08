import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicializa a aplicação Firebase usando as credenciais do firebase-applet-config.json
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Instâncias de banco de dados (Firestore com ID dedicado) e autenticação
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export { app };
export default app;
