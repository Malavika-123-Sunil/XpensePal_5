// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQaHyx81V1b8q7-7XWLP9UlW4zjTd0SC8",
    authDomain: "xpensepal-a5042.firebaseapp.com",
    projectId: "xpensepal-a5042",
    storageBucket: "xpensepal-a5042.firebasestorage.app",
    messagingSenderId: "14137785761",
    appId: "1:14137785761:web:592af038e9a388013f9fe0"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
const app = initializeApp(firebaseConfig);

export { app }; 