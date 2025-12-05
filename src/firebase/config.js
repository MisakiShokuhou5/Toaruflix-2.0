// ARQUIVO: src/firebase/config.js 
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 
import { getAuth } from "firebase/auth"; // CRÍTICO: Importar o módulo de autenticação

// Sua configuração Firebase
const firebaseConfig = {
    apiKey: "AIzaSyATseyMtu7fbn-vvJQKDNVwQE0uMH36trc",
    authDomain: "toarucrunchyrol-29ce4.firebaseapp.com",
    projectId: "toarucrunchyrol-29ce4",
    storageBucket: "toarucrunchyrol-29ce4.firebasestorage.app",
    messagingSenderId: "338286357239",
    appId: "1:338286357239:web:63747e65b6f8df534301f2",
    measurementId: "G-BHE2WLLMDX"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Authentication (CRÍTICO)
export const auth = getAuth(app); // EXPORTAÇÃO NECESSÁRIA PARA O useAuth

// Initialize Firestore
export const db = getFirestore(app); 

// Você pode manter o analytics, mas não é necessário para a correção deste erro
// import { getAnalytics } from "firebase/analytics";
// const analytics = getAnalytics(app);