import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDNQUmBg8aqqhcP626gErPNKXLS-6fx1Wg",
  authDomain: "med-app-31219.firebaseapp.com",
  projectId: "med-app-31219",
  storageBucket: "med-app-31219.firebasestorage.app",
  messagingSenderId: "888828515194",
  appId: "1:888828515194:web:6eda8a7aa0d518e2c03cc3",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);