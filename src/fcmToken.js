// getFcmToken.js
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import firebaseApp from "firebaseConfig";

const VAPID_KEY = "BDiFV1Hf9K8SMMm2yShUbBtJ9eUfuOb78vcNBF_BC_a6Y4IwXflB00HaLEDs-NmiUI8_yjl2-8DdP5hFhMwoLpo"; // ✅ Your real key

async function getFcmToken() {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("🚫 Firebase Messaging not supported in this browser.");
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("🔒 Notification permission not granted");
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const messaging = getMessaging(firebaseApp);

    // Get token using registered service worker
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration, // ✅ THIS IS REQUIRED
    });

    return token;
  } catch (error) {
    console.error("❌ FCM Token Error:", error);
    return null;
  }
}

export default getFcmToken;
