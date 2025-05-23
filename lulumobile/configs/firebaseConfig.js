// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDHHZJHR7P8gf6vP58SCHFzqHqEoUUSO34",
  authDomain: "luluchat-2025.firebaseapp.com",
  projectId: "luluchat-2025",
  storageBucket: "luluchat-2025.firebasestorage.app",
  messagingSenderId: "607017608726",
  appId: "1:607017608726:web:824fadfc0fd6c5c0c03737",
  measurementId: "G-W3108SSRDL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { db };