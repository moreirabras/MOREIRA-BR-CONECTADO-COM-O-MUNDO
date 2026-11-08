import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

export const useCloudSync = (collectionName: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;
    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 5;

    const startListener = () => {
      const q = query(collection(db, collectionName), orderBy('timestamp', 'desc'));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setData(items);
          setLoading(false);
          retryCount = 0; // Reset retry count on success
        },
        (err: any) => {
          console.error(`Firebase sync error (${collectionName}):`, err);
          
          // Check for "CANCELLED" or "unavailable" errors which often happen on idle/timeout
          const isRetryable = err.code === 'cancelled' || err.code === 'unavailable' || err.message?.includes('CANCELLED');
          
          if (isRetryable && retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff
            console.log(`Retrying Firestore listener for ${collectionName} in ${delay}ms (attempt ${retryCount})...`);
            retryTimeout = setTimeout(startListener, delay);
          } else {
            setError(err);
            setLoading(false);
          }
        }
      );
    };

    startListener();

    return () => {
      if (unsubscribe) unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [collectionName]);

  return { data, loading, error };
};
