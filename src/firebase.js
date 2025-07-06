// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQACQPRJm3AFmNjRTHpJU4GCp3IHxQTXQ",
  authDomain: "peakbrew.firebaseapp.com",
  projectId: "peakbrew",
  storageBucket: "peakbrew.firebasestorage.app",
  messagingSenderId: "990739032899",
  appId: "1:990739032899:web:6b96907d7195ed2d2fddf6",
  measurementId: "G-MZ55PBQZFW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, analytics };
export default app;