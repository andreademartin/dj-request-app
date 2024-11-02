import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, update, set, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDDNDHCR2tgfq_W_I0SVxuRpfX7dMYubuY",
  authDomain: "dj-request-app-a42b4.firebaseapp.com",
  databaseURL: "https://dj-request-app-a42b4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dj-request-app-a42b4",
  storageBucket: "dj-request-app-a42b4.firebasestorage.app",
  messagingSenderId: "980924389255",
  appId: "1:980924389255:web:0e686968f0a5fe394ba522"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, push, onValue, update, set, get };