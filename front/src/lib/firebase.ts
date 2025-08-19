// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbdczS-DR0hBN30C6rEn4CQ5sbs9TTrog",
  authDomain: "brandorb-ai.firebaseapp.com",
  projectId: "brandorb-ai",
  storageBucket: "brandorb-ai.firebasestorage.app",
  messagingSenderId: "359713314636",
  appId: "1:359713314636:web:ecd911cc4e159b1fece1e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
