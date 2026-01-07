// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCNW2QWiOpbsXvuoSU2iQz1BUhiHmNzKus",
  authDomain: "guess-it-app-c553b.firebaseapp.com",
  projectId: "guess-it-app-c553b",
  storageBucket: "guess-it-app-c553b.firebasestorage.app",
  messagingSenderId: "159180229656",
  appId: "1:159180229656:web:fa2b96327dd24838f0c76d"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);