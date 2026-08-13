// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQDQfYuhf0AWOtmcdufVGeXlzwnSJ33Vw",
  authDomain: "ong5mushroom-vietnam.firebaseapp.com",
  projectId: "ong5mushroom-vietnam",
  storageBucket: "ong5mushroom-vietnam.firebasestorage.app",
  messagingSenderId: "931399604992",
  appId: "1:931399604992:web:134c9bfbddbfef97cd31e5",
  measurementId: "G-G0HJZJTFZ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
