// Import Firebase core qua CDN (Dành cho web HTML/JS thuần)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Cấu hình Firebase thực tế của Nấm Ông 5
const firebaseConfig = {
  apiKey: "AIzaSyBQDQfYuhf0AWOtmcdufVGeXlzwnSJ33Vw",
  authDomain: "ong5mushroom-vietnam.firebaseapp.com",
  projectId: "ong5mushroom-vietnam",
  storageBucket: "ong5mushroom-vietnam.firebasestorage.app",
  messagingSenderId: "931399604992",
  appId: "1:931399604992:web:134c9bfbddbfef97cd31e5",
  measurementId: "G-G0HJZJTFZ3"
};

// Khởi tạo Firebase và xuất các biến để các file khác sử dụng
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
