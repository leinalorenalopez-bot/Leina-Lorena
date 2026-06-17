import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAj2hnit3Ubk4yfPNGTufsiKmzMotkZWLc",
  authDomain: "gen-lang-client-0672963887.firebaseapp.com",
  projectId: "gen-lang-client-0672963887",
  storageBucket: "gen-lang-client-0672963887.firebasestorage.app",
  messagingSenderId: "775338378191",
  appId: "1:775338378191:web:05f965bd4cf4973b0408ba"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-1ba3b217-fa00-4627-84d5-96c5ca25be0e");

export { app, auth, db };
