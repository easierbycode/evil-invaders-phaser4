import { initializeApp, FirebaseApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  Database,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

/** Firebase project configuration */
// const firebaseConfig = {
//   apiKey: "AIzaSyAOWwht5ieLYlbgk_pOYdEQeEAscAxXmeY",
//   authDomain: "spritehub-c3a33.firebaseapp.com",
//   projectId: "spritehub-c3a33",
//   storageBucket: "spritehub-c3a33.firebasestorage.app",
//   messagingSenderId: "957606226872",
//   appId: "1:957606226872:web:d5244182e4d6a66090bd4d",
// };
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

let _app: FirebaseApp | null = null;
let _db: Database | null = null;

export function getDB(): Database {
  if (!_db) {
    _app = initializeApp(firebaseConfig);
    _db = getDatabase(_app);
  }
  return _db;
}

export { ref, get, set };