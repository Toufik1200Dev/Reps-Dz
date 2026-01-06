// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8QX3LFXdH6qJ-jrO5X9KTUfM86etSs9o",
  authDomain: "reps-dz.firebaseapp.com",
  projectId: "reps-dz",
  storageBucket: "reps-dz.firebasestorage.app",
  messagingSenderId: "749930507084",
  appId: "1:749930507084:web:021d68a6495ced7d2a3de9",
  measurementId: "G-JGYP5R5RST"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
