import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCYSUVIFOTYadjTHCe7GN2q5um3ut9qg7U',
  authDomain: 'bellapersonalizados-1a79f.firebaseapp.com',
  projectId: 'bellapersonalizados-1a79f',
  storageBucket: 'bellapersonalizados-1a79f.firebasestorage.app',
  messagingSenderId: '685844589804',
  appId: '1:685844589804:web:f0d324dbd66bfa90a149c9',
  measurementId: 'G-92GLYWLP4M',
};

export const db = getFirestore(initializeApp(firebaseConfig));
