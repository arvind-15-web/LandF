import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDL8C0IKuK1DFqlDCM6ygnmlPhtf5suMEU",
  authDomain: "landf-75040.firebaseapp.com",
  projectId: "landf-75040",
  storageBucket: "landf-75040.firebasestorage.app",
  messagingSenderId: "529017952828",
  appId: "1:529017952828:web:179ef812a5b4e87a990139",
  measurementId: "G-9DQFMN8J0H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Messaging (push notifications) — only in supported browsers
let messaging = null;
try {
  messaging = getMessaging(app);
} catch {
  console.warn('Firebase Messaging not supported in this browser');
}
export { messaging };

export const requestNotificationPermission = async () => {
  try {
    if (!messaging) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    return token;
  } catch (err) {
    console.warn('FCM token error:', err.message);
    return null;
  }
};

export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};
