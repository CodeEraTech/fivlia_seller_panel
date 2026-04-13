import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOtUDhG_Sk6ewi8CRBHYNJVwtWy-pWYh0",
  authDomain: "fivlia-quick-commerce.firebaseapp.com",
  projectId: "fivlia-quick-commerce",
};

const FIREBASE_APP_NAME = "fivlia-firestore";

const firebaseApp =
  getApps().find((app) => app.name === FIREBASE_APP_NAME) ||
  initializeApp(firebaseConfig, FIREBASE_APP_NAME);

const db = getFirestore(firebaseApp);
export default db;
