import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyD_wiUFqviJmW6f6rDIi80UTokYaSGb-Ho',
  authDomain: 'rejjanevendas-9d679.firebaseapp.com',
  projectId: 'rejjanevendas-9d679',
  storageBucket: 'rejjanevendas-9d679.firebasestorage.app',
  messagingSenderId: '367312823145',
  appId: '1:367312823145:web:0fc87162190caee114d3f8',
  measurementId: 'G-5WW8V2MWKX',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
