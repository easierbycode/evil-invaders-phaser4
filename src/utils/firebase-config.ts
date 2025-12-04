/** Firebase project configuration */
const firebaseConfig = {
  apiKey: "AIzaSyAHY_agipyNEXvY2J4jDgnlk9kLeM6O37Y",
  authDomain: "evil-invaders.firebaseapp.com",
  databaseURL: "https://evil-invaders-default-rtdb.firebaseio.com",
  projectId: "evil-invaders",
  storageBucket: "evil-invaders.firebasestorage.app",
  messagingSenderId: "149257705855",
  appId: "1:149257705855:web:3f048481dfc66cef61224a"
};

/** The DB node used for this project */
export const OVERRIDES_PATH = "atlas-overrides/evil-invaders";

// Firebase module references (loaded dynamically)
let firebaseApp: any = null;
let firebaseDatabase: any = null;
let _app: any = null;
let _db: any = null;

// Track initialization state
let _initPromise: Promise<boolean> | null = null;

/**
 * Dynamically load Firebase modules (only when online)
 */
async function loadFirebaseModules(): Promise<boolean> {
  if (!navigator.onLine) {
    console.log("Offline mode: skipping Firebase SDK load");
    return false;
  }

  try {
    const [appModule, dbModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js")
    ]);
    firebaseApp = appModule;
    firebaseDatabase = dbModule;
    return true;
  } catch (err) {
    console.warn("Failed to load Firebase SDK:", err);
    return false;
  }
}

/**
 * Initialize Firebase (call this before using getDB)
 */
export async function initFirebase(): Promise<boolean> {
  if (_initPromise) return _initPromise;

  _initPromise = loadFirebaseModules().then((loaded) => {
    if (loaded && firebaseApp && firebaseDatabase) {
      _app = firebaseApp.initializeApp(firebaseConfig);
      _db = firebaseDatabase.getDatabase(_app);
      return true;
    }
    return false;
  });

  return _initPromise;
}

/**
 * Get the Firebase database instance (may be null if offline)
 */
export function getDB(): any {
  return _db;
}

/**
 * Create a database reference (returns null if offline)
 */
export function ref(db: any, path: string): any {
  if (!firebaseDatabase || !db) return null;
  return firebaseDatabase.ref(db, path);
}

/**
 * Get data from database (returns null if offline)
 */
export async function get(reference: any): Promise<any> {
  if (!firebaseDatabase || !reference) return { val: () => null };
  return firebaseDatabase.get(reference);
}

/**
 * Set data in database (no-op if offline)
 */
export async function set(reference: any, value: any): Promise<void> {
  if (!firebaseDatabase || !reference) return;
  return firebaseDatabase.set(reference, value);
}
