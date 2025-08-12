// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA8OQ6d7JLzFLFZbq0E8dKO6LqZ9AnbR60",
  authDomain: "YOUR_DOMAIN.firebaseapp.com",
  projectId: "fivlia.firebaseapp.com",
  appId: "1:1026617575916:android:fd0216a3ef138446ac58c9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export default auth;
