// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// 
// NOTE: Firebase web API keys are intentionally public and safe to expose in client-side code.
// This is expected behavior for web apps. Security is enforced via Firebase Console domain restrictions.
// To restrict usage: Firebase Console > Project Settings > API Keys > Restrict by HTTP referrer
const firebaseConfig = {
  apiKey: "AIzaSyA8QX3LFXdH6qJ-jrO5X9KTUfM86etSs9o", // Public web API key (safe for client-side)
  authDomain: "reps-dz.firebaseapp.com",
  projectId: "reps-dz",
  storageBucket: "reps-dz.firebasestorage.app",
  messagingSenderId: "749930507084",
  appId: "1:749930507084:web:021d68a6495ced7d2a3de9",
  measurementId: "G-JGYP5R5RST"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (options object avoids deprecated-params warning)
const analytics = initializeAnalytics(app, {});

export { app, analytics };
