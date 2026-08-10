# ClientHub CRM — Firebase Split Edition

## Firestore structure

```text
counters/
  clientId
    next: 40000

clients/
  C40001/
    clientId
    clientName
    legalName
    mobile
    email
    constitution
    status
    pan
    gstin
    aadhaar
    address
    branchId
    notes
    folderUrl
    createdAt
    updatedAt

    credentials/
    compliance/
    contacts/
    ledgers/
    vouchers/
    voucherSales/
```

The client document ID itself is the Client ID (`C40001`, `C40002`, ...).
This prevents duplicate client IDs when creation goes through the transaction in
`js/client-service.js`.

Authentication is separate from Firestore profile data:

```text
Firebase Authentication
  └── Firebase UID

Firestore
  └── users/{uid}
```

## Files

- `index.html` — authenticated app shell
- `login.html` — login page
- `splash.html` — splash screen
- `manifest.webmanifest` — PWA manifest
- `sw.js` — service worker (must be JS, not HTML)
- `firebase-config.js` — Firebase project configuration
- `js/firebase.js` — Firebase initialization
- `js/auth.js` — authentication
- `js/client-service.js` — Client ID + Clients CRUD
- `js/app.js` — shell/navigation
- `js/pages.js` — page renderers
- `pages/*.html` — requested page files

## Important

Replace `assets/logo.png` with your actual logo.

Enable Email/Password in Firebase Authentication.

Firestore rules should be deployed before production use.
