import type { CanvasState } from '../types';

const DB_NAME = 'tldfetch-db';
const DB_VERSION = 1;
const STORE_NAME = 'canvas-state';

/**
 * Initialize IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error('Failed to open IndexedDB'));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

/**
 * Save canvas state to IndexedDB
 */
export async function saveState(state: Partial<CanvasState>): Promise<void> {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        store.put(state, 'canvasState');

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                db.close();
                resolve();
            };
            transaction.onerror = () => {
                db.close();
                reject(new Error('Failed to save state'));
            };
        });
    } catch (error) {
        console.error('Error saving state to IndexedDB:', error);
        throw error;
    }
}

/**
 * Load canvas state from IndexedDB
 */
export async function loadState(): Promise<Partial<CanvasState> | null> {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('canvasState');

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                db.close();
                resolve(request.result || null);
            };
            request.onerror = () => {
                db.close();
                reject(new Error('Failed to load state'));
            };
        });
    } catch (error) {
        console.error('Error loading state from IndexedDB:', error);
        return null;
    }
}

/**
 * Clear all data from IndexedDB
 */
export async function clearState(): Promise<void> {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        store.clear();

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                db.close();
                resolve();
            };
            transaction.onerror = () => {
                db.close();
                reject(new Error('Failed to clear state'));
            };
        });
    } catch (error) {
        console.error('Error clearing state from IndexedDB:', error);
        throw error;
    }
}
