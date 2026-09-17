// COREBIQ Client Portal - Firebase connection
// Keep Firebase configuration in this file.
// Web API keys are not database passwords; Firestore/Storage rules protect data.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";
import { getAI, getGenerativeModel, GoogleAIBackend } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-ai.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCXyKSTlmlzkYnH2LW408cVVWV1CPvlfBo",
  authDomain: "cmfilings-6a37c.firebaseapp.com",
  projectId: "cmfilings-6a37c",
  storageBucket: "cmfilings-6a37c.firebasestorage.app",
  messagingSenderId: "138705123778",
  appId: "1:138705123778:web:9561bff9f0f5d89bb6fe5b"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Firebase AI Logic / Gemini Developer API backend.
// Enable AI Logic in Firebase Console before using the assistant.
export const ai = getAI(app, {
  backend: new GoogleAIBackend()
});

export const gemini = getGenerativeModel(ai, {
  model: "gemini-3.8-flash",
  systemInstruction: `
You are COREBIQ Client Assistant.
Help clients understand their tax, compliance, accounting,
document and payment information shown inside the client portal.
Do not invent due dates, filing status, amounts, legal conclusions,
or payment completion. If information is not present in the supplied
portal context, say that the client should contact COREBIQ.
Keep answers concise, professional and easy to understand.
`
});
