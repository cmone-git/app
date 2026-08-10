import { FB } from "./firebase.js";

export function watchAuth(callback) {
  return FB.onAuthStateChanged(FB.auth, callback);
}

export async function login(email, password) {
  return FB.signInWithEmailAndPassword(FB.auth, email.trim(), password);
}

export async function signup(email, password) {
  return FB.createUserWithEmailAndPassword(FB.auth, email.trim(), password);
}

export async function logout() {
  await FB.signOut(FB.auth);
}

export async function saveUserProfile(user, extra = {}) {
  if (!user?.uid) throw new Error("No authenticated user.");
  const ref = FB.doc(FB.db, "users", user.uid);
  await FB.setDoc(ref, {
    uid: user.uid,
    email: user.email || "",
    ...extra,
    updatedAt: FB.serverTimestamp()
  }, { merge: true });
}

export async function getUserProfile(uid) {
  const snap = await FB.getDoc(FB.doc(FB.db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
