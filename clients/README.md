# COREBIQ Client Portal

Static Firebase/PWA client portal.

## Included
- Existing client login by registered client email
- Email verification before portal access
- New-client signup request
- Admin approval workflow using `signup_requests`
- Client ID generated/assigned by admin
- Compliance statement
- Document listing
- Secure client document upload to Firebase Storage
- Payment initiation with direct UPI and Razorpay link
- Gemini assistant through Firebase AI Logic
- PWA manifest + service worker
- Firestore and Storage security rules

## Firebase data expectations

Existing `clients` documents should contain at minimum:

```text
clientId
clientName
email
mobile
status
```

Example:

```text
clients/C40001
  clientId: C40001
  clientName: ABC TRADERS
  email: client@example.com
  mobile: 9999999999
  status: active
```

Compliance documents should contain:

```text
clientId
clientEmail
service
returnType
financialYear
period
dueDate
status
remarks
```

Document metadata:

```text
clientId
clientEmail
firebaseUid
category
documentType
fileName
storagePath
downloadURL
uploadedAt
status
```

Payment records:

```text
clientId
clientEmail
firebaseUid
amount
description
transactionId
upiId
method
status
createdAt
```

## New client approval

A new user creates a Firebase Authentication account and verifies email.
The app creates:

```text
signup_requests/{requestId}
```

with status `pending`.

Admin then creates/updates the corresponding `clients/Cxxxxx` document
and sets the request status to `approved` and assigns `clientId`.

## Gemini

In Firebase Console:
1. Open AI Services > AI Logic.
2. Configure Gemini Developer API.
3. Configure Firebase App Check for production.

The app uses Firebase AI Logic rather than embedding a raw Gemini API key.

## Deploy

This is a static site. Upload the folder to Firebase Hosting, GitHub Pages,
Hostinger, or another HTTPS static host.

For Firebase Hosting:

```bash
firebase init hosting
firebase deploy
```

Do not expose Firebase Admin SDK service-account keys in this frontend.

## Automatic daily backup

This package now includes `functions/dailyFirestoreBackup`.
It runs every day at **02:30 AM India time (Asia/Kolkata)** and starts a
managed Firestore export into the Firebase Storage bucket under:

```text
_backups/firestore/YYYY-MM-DD/
```

Each date is a separate recovery snapshot. It does not overwrite earlier
backup dates.

### Enable the daily backup

Firebase scheduled Cloud Functions require the project to be on a billing-
enabled plan and the deployer/service account must have permission to export
Firestore data to Cloud Storage.

From the project folder:

```bash
firebase login
firebase use YOUR_PROJECT_ID
cd functions
npm install
cd ..
firebase deploy --only functions:dailyFirestoreBackup
```

The function is intentionally server-side. No Admin SDK credentials or service
account keys are placed in the client app.

## Automatic duplicate-file protection

Client uploads now calculate a SHA-256 content hash before uploading.
The app checks the client's existing document metadata for the same hash.
If the exact same file content was already uploaded, the second upload is
stopped automatically.

The Storage object path is deterministic:

```text
client_files/{firebaseUid}/{sha256}_{safeFileName}
```

and document metadata uses a deterministic ID based on the Firebase UID and
SHA-256 hash. This prevents repeated submissions from creating a new physical
file for the same client.

This duplicate protection is based on file content, not just filename, so a
renamed copy of the exact same file is also detected. Different content with
the same filename is still allowed.
