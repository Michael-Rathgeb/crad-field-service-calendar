import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAg8fsL8Oeh7qB53RE2XdbHId9_kPy6UyE",
  authDomain: "crad-calendar.firebaseapp.com",
  projectId: "crad-calendar",
  storageBucket: "crad-calendar.firebasestorage.app",
  messagingSenderId: "46364456888",
  appId: "1:46364456888:web:7c750d73938f1fecdc014d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
