import firebase from "firebase/compat/app";
import "firebase/compat/messaging";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2kNJ9bPAzuGBvUh8OFfBY6yFnBvKZVNU",
  authDomain: "fivlia-quick-commerce.firebaseapp.com",
  projectId: "fivlia-quick-commerce",
  storageBucket: "fivlia-quick-commerce.firebasestorage.app",
  messagingSenderId: "566192067637",
  appId: "1:566192067637:web:e0b4ec3148b11fe965cd7c",
  measurementId: "G-J61W9MRW30"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
getAnalytics(firebaseApp);
const auth = getAuth(firebaseApp);
export default firebaseApp;
