import { FB } from "./firebase.js";

/*
  CLIENT STORAGE MODEL

  clients/C40001
  clients/C40001/credentials/...
  clients/C40001/compliance/...
  clients/C40001/contacts/...
  clients/C40001/ledgers/...
  clients/C40001/vouchers/...
  clients/C40001/voucherSales/...

  The document ID is the business Client ID.
  We do NOT use addDoc() for the main client record.
*/

const CLIENT_COLLECTION = "clients";
const COUNTER_DOC = FB.doc(FB.db, "counters", "clientId");

export const clientRef = (clientId) =>
  FB.doc(FB.db, CLIENT_COLLECTION, String(clientId).toUpperCase());

export async function getNextClientId() {
  const snap = await FB.getDoc(COUNTER_DOC);
  const current = snap.exists() && Number.isFinite(Number(snap.data().next))
    ? Number(snap.data().next)
    : 40000;
  return `C${current + 1}`;
}

export async function createClient(clientData) {
  const now = new Date().toISOString();

  // Atomic counter + client creation.
  return FB.runTransaction(FB.db, async (tx) => {
    const counterSnap = await tx.get(COUNTER_DOC);
    let current = counterSnap.exists() ? Number(counterSnap.data().next) : 40000;
    if (!Number.isFinite(current) || current < 40000) current = 40000;

    const nextNumber = current + 1;
    const clientId = `C${nextNumber}`;
    const ref = clientRef(clientId);

    const existing = await tx.get(ref);
    if (existing.exists()) {
      throw new Error(`Client ID ${clientId} already exists. Please retry.`);
    }

    const data = normalizeClient({
      ...clientData,
      clientId,
      createdAt: now,
      updatedAt: now
    });

    tx.set(ref, data);
    tx.set(COUNTER_DOC, {
      next: nextNumber,
      updatedAt: FB.serverTimestamp()
    }, { merge: true });

    return { id: clientId, ...data };
  });
}

export async function createClientWithSpecifiedId(clientData) {
  const clientId = normalizeClientId(clientData.clientId);
  if (!clientId) throw new Error("A valid Client ID is required.");

  const ref = clientRef(clientId);
  const existing = await FB.getDoc(ref);
  if (existing.exists()) {
    throw new Error(`Duplicate Client ID: ${clientId}`);
  }

  const now = new Date().toISOString();
  const data = normalizeClient({
    ...clientData,
    clientId,
    createdAt: now,
    updatedAt: now
  });

  await FB.setDoc(ref, data);
  await bumpCounterIfNeeded(clientId);
  return { id: clientId, ...data };
}

async function bumpCounterIfNeeded(clientId) {
  const n = Number(clientId.replace(/\D/g, ""));
  if (!Number.isFinite(n)) return;

  await FB.runTransaction(FB.db, async (tx) => {
    const snap = await tx.get(COUNTER_DOC);
    const current = snap.exists() ? Number(snap.data().next) : 40000;
    if (n > current) {
      tx.set(COUNTER_DOC, { next: n, updatedAt: FB.serverTimestamp() }, { merge: true });
    }
  });
}

export async function updateClient(clientId, patch) {
  const id = normalizeClientId(clientId);
  if (!id) throw new Error("Invalid Client ID.");

  await FB.updateDoc(clientRef(id), {
    ...normalizeClient(patch, true),
    clientId: id,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteClient(clientId) {
  const id = normalizeClientId(clientId);
  if (!id) throw new Error("Invalid Client ID.");
  await FB.deleteDoc(clientRef(id));
}

export async function getClient(clientId) {
  const snap = await FB.getDoc(clientRef(clientId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function watchClients(callback, onError = console.error) {
  const q = FB.query(
    FB.collection(FB.db, CLIENT_COLLECTION),
    FB.orderBy("clientId", "asc")
  );
  return FB.onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  }, onError);
}

export async function saveClientSubdocument(clientId, subcollection, data, subId = null) {
  const id = normalizeClientId(clientId);
  const collectionRef = FB.collection(FB.db, CLIENT_COLLECTION, id, subcollection);

  if (subId) {
    await FB.setDoc(FB.doc(collectionRef, subId), {
      ...data,
      clientId: id,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return subId;
  }

  const ref = await FB.addDoc(collectionRef, {
    ...data,
    clientId: id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return ref.id;
}

export async function listClientSubcollection(clientId, subcollection) {
  const id = normalizeClientId(clientId);
  const ref = FB.collection(FB.db, CLIENT_COLLECTION, id, subcollection);
  const snap = await FB.getDocs(ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function normalizeClientId(value) {
  const raw = String(value || "").trim().toUpperCase();
  return /^C\d{5,}$/.test(raw) ? raw : "";
}

export function normalizeClient(data, partial = false) {
  const out = { ...data };

  if (!partial || "clientName" in out) out.clientName = String(out.clientName || "").trim();
  if (!partial || "legalName" in out) out.legalName = String(out.legalName || "").trim();
  if (!partial || "mobile" in out) out.mobile = String(out.mobile || "").replace(/\D/g, "").slice(0, 10);
  if (!partial || "email" in out) out.email = String(out.email || "").trim();
  if (!partial || "constitution" in out) out.constitution = String(out.constitution || "");
  if (!partial || "status" in out) out.status = String(out.status || "Active");
  if (!partial || "pan" in out) out.pan = String(out.pan || "").toUpperCase().trim();
  if (!partial || "gstin" in out) out.gstin = String(out.gstin || "").toUpperCase().trim();
  if (!partial || "aadhaar" in out) out.aadhaar = String(out.aadhaar || "").replace(/\D/g, "").slice(0, 12);
  // Accept the old spelling from your original code too.
  if ("adhar" in out && !("aadhaar" in out)) {
    out.aadhaar = String(out.adhar || "").replace(/\D/g, "").slice(0, 12);
    delete out.adhar;
  }
  if (!partial || "address" in out) out.address = String(out.address || "").trim();
  if (!partial || "branchId" in out) out.branchId = String(out.branchId || "").trim().toUpperCase();
  if (!partial || "notes" in out) out.notes = String(out.notes || "");
  if (!partial || "folderUrl" in out) out.folderUrl = String(out.folderUrl || "").trim();

  delete out.id;
  return out;
}
