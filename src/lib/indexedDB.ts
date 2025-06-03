import { hash, compare } from 'bcryptjs';

const DB_NAME = 'passwordManagerDB';
const DB_VERSION = 1;
const STORE_NAME = 'userSettings';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const getStoredPIN = async (): Promise<string | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('pin');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

export const storePIN = async (pin: string): Promise<void> => {
  const hashedPin = await hash(pin, 10);
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(hashedPin, 'pin');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const verifyPIN = async (pin: string): Promise<boolean> => {
  const storedHashedPin = await getStoredPIN();
  if (!storedHashedPin) return false;
  
  return compare(pin, storedHashedPin);
}; 