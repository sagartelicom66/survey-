# Shopping Survey App – Setup Guide

## Files
- `index.html` – Survey (public)
- `admin.html` – Admin panel
- `app.js` – Survey logic
- `admin.js` – Admin logic
- `firebase.js` – Firebase config & helpers
- `styles.css` – Shared styles
- `firestore.rules` – Security rules

## Setup Steps

### 1. Firebase Project
1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable **Firestore Database** (production mode)
4. Enable **Authentication → Email/Password**
5. Create an admin user under Authentication

### 2. Configure firebase.js
Replace the placeholder values in `firebase.js`:
```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Deploy Firestore Rules
In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`.

### 4. Add Banner Image (optional)
Place a `banner.jpg` in the same folder for the cricket tournament banner on the welcome screen.

### 5. Host
- Use **Firebase Hosting** (`firebase deploy`) or any static host
- Both `index.html` and `admin.html` must be served from the same origin

## Firestore Collections
| Collection | Purpose |
|---|---|
| `responses` | Survey submissions (keyed by Participant ID) |
| `winners` | Lucky draw winners |
| `settings/survey` | Survey status (`active`, `paused`, `stopped`) + `announceAt` timestamp |
| `admins` | Admin user records |

## Survey Flow
1. Welcome → language select
2. Introduction → agree checkbox → Start Survey
3. 25 questions, one per screen, with back/next navigation
4. Submit → duplicate mobile check → save to Firestore → Thank You page

## Admin Flow
1. Login at `admin.html`
2. Dashboard shows stats
3. Control survey status (Start / Pause / Stop)
4. View & search all responses, export CSV
5. After stopping: set winner announcement delay, run spin wheel, pick 2 winners
