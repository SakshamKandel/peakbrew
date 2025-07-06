// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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