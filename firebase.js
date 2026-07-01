import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpowiKCxlkeoXMb5vC_ZN9c9Zkyq30Z5U",
  authDomain: "survey-8908b.firebaseapp.com",
  projectId: "survey-8908b",
  storageBucket: "survey-8908b.firebasestorage.app",
  messagingSenderId: "358631725231",
  appId: "1:358631725231:web:752ceed803b42f71075c5a",
  measurementId: "G-X6GZMM23L9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function isSurveyClosed() {
  const snap = await getDoc(doc(db, "settings", "survey"));
  return snap.exists() && snap.data().status === "stopped";
}

export async function getSurveyStatus() {
  const snap = await getDoc(doc(db, "settings", "survey"));
  return snap.exists() ? snap.data() : { status: "active" };
}

export async function mobileExists(mobile) {
  const q = query(collection(db, "responses"), where("mobile", "==", mobile));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function saveResponse(data) {
  const id = "SURV-2026-" + String(Math.floor(Math.random() * 9000) + 1000);
  await setDoc(doc(db, "responses", id), {
    ...data,
    participantId: id,
    timestamp: serverTimestamp()
  });
  return id;
}

export async function getAllResponses() {
  const snap = await getDocs(collection(db, "responses"));
  return snap.docs.map(d => d.data());
}

export async function updateSurveyStatus(status) {
  await setDoc(doc(db, "settings", "survey"), { status }, { merge: true });
}

export async function setWinnerDelay(minutes) {
  const announceAt = Date.now() + minutes * 60000;
  await setDoc(doc(db, "settings", "survey"), { announceAt }, { merge: true });
}

export async function saveWinner(data) {
  await addDoc(collection(db, "winners"), data);
}

export async function getWinners() {
  const snap = await getDocs(collection(db, "winners"));
  return snap.docs.map(d => d.data());
}

export async function getEligibleParticipants() {
  const winners = await getWinners();
  const winnerIds = winners.map(w => w.participantId);
  const all = await getAllResponses();
  return all.filter(r => !winnerIds.includes(r.participantId));
}

export { signInWithEmailAndPassword, signOut, onAuthStateChanged, updateDoc, doc, setDoc };
