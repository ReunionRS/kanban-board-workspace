// firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; 

const firebaseConfig = {
  apiKey: "AIzaSyCKfmk2HB5zK41fNV3xus7tXGBU2F98vkw",
  authDomain: "kanban-task-f6e03.firebaseapp.com",
  projectId: "kanban-task-f6e03",
  storageBucket: "kanban-task-f6e03.firebasestorage.app",
  messagingSenderId: "989202157854",
  appId: "1:989202157854:web:cdcc374521dda013c0b90f",
  measurementId: "G-H89TS2S54J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export default app;