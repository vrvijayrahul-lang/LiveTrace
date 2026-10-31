# LiveTrace 📡

> **Consent-First Live Location Sharing Platform**  
> Engineered with zero-covert tracking principles, 24-hour auto-expiring sessions, SHA-256 cryptographic token hashing, and a dual-engine architecture (Production Firebase + Cross-Tab Reactive Simulator).

[![Tests](https://img.shields.io/badge/tests-19%20passed-emerald?style=flat-square)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%20strict-blue?style=flat-square)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-cyan?style=flat-square)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3-violet?style=flat-square)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-slate?style=flat-square)](LICENSE)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Strict Privacy & Sovereign Consent Principles](#2-strict-privacy--sovereign-consent-principles)
3. [Architecture Overview: Dual-Engine Design](#3-architecture-overview-dual-engine-design)
4. [Cryptographic Security Model](#4-cryptographic-security-model)
5. [Prerequisites](#5-prerequisites)
6. [Environment Variables & Configuration](#6-environment-variables--configuration)
7. [Local Installation & Development](#7-local-installation--development)
8. [Cross-Window Simulator Engine](#8-cross-window-simulator-engine)
9. [Step-by-Step End-to-End Testing Workflows](#9-step-by-step-end-to-end-testing-workflows)
10. [Firebase Production Setup Guide](#10-firebase-production-setup-guide)
11. [Firestore Security Rules](#11-firestore-security-rules)
12. [Cloud Functions Deployment](#12-cloud-functions-deployment)
13. [Production Build & Hosting](#13-production-build--hosting)
14. [Automated Testing Suite](#14-automated-testing-suite)
15. [Code Quality & Linting](#15-code-quality--linting)
16. [Browser Compatibility & Geolocation Constraints](#16-browser-compatibility--geolocation-constraints)
17. [Live Telemetry & Stale Signal Detection](#17-live-telemetry--stale-signal-detection)
18. [Security Checklist & Compliance Verification](#18-security-checklist--compliance-verification)

---

## 1. Executive Summary

**LocateFlow** is a modern, privacy-respecting live location coordination application designed for couriers, meetups, field workers, travel safety, and outdoor activities. 

Traditional tracking tools frequently infringe upon user sovereignty through covert background tracking, indefinite data persistence, or unencrypted link sharing. LocateFlow solves this by enforcing:

- **Uncompromising Explicit Consent**: Zero coordinates are requested or captured simply by opening a link.
- **Recipient Sovereignty**: The recipient sees an explicit authorization dialogue detailing who is asking, what data is collected, and why. A persistent, prominent **"Stop Sharing"** button is accessible at all times.
- **Hard 24-Hour Expiration**: All tracking links and coordinate broadcast pipelines self-terminate after 24 hours.
- **Owner Revocation**: The session creator can immediately revoke access at any point from their dashboard.
- **Dual-Engine Flexibility**: Runs fully offline/locally with a multi-tab Pub/Sub `BroadcastChannel` simulator, or connects to Firebase Authentication, Cloud Firestore, and Cloud Functions with zero code changes.

---

## 2. Strict Privacy & Sovereign Consent Principles

LocateFlow enforces the following non-negotiable security directives:

| Directive | Enforcement Mechanism |
| :--- | :--- |
| **No Silent Tracking** | Geolocation `watchPosition` is strictly dormant until the recipient clicks the explicit `"Share My Live Location"` button. |
| **No Permission Bypass** | Never circumvents or spoof-prompts native browser location dialogs. Uses W3C Geolocation API standard flows. |
| **No IP Geolocation Workaround** | If a recipient declines GPS permission, LocateFlow **never** falls back to coarse IP lookup or WiFi triangulation to approximate their location against their will. |
| **No Covert Surveillance** | Full disclosure is presented on the consent screen: who requested the session, what data will be sent, accuracy limits, and expiration timestamp. |
| **Sovereign Recipient Termination** | Recipient retains the ability to cancel streaming instantly via **Stop Sharing**, immediately tearing down browser watches and notifying the owner. |
| **Owner-Exclusive Coordinate Read Access** | Firestore security rules enforce that live coordinates stored under `/trackingSessions/{id}/location/current` can **only** be read by the session's authenticated owner (`request.auth.uid == ownerUid`). |
| **No Raw Token Storage** | Shareable URLs embed a 32-byte CSPRNG token; Firestore only stores a one-way `SHA-256` hash of this token. |

---

## 3. Architecture Overview: Dual-Engine Design

LocateFlow is architected with a decoupled service abstraction layer:

```
                  ┌───────────────────────────────────────────────┐
                  │           LocateFlow React Frontend           │
                  │  (Zod Schemas + Leaflet + Tailwind CSS + Vite) │
                  └───────────────────────┬───────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │         Service Layer Abstraction             │
                  │  (authService, sessionService, locationService)│
                  └───────────────┬───────────────┬───────────────┘
                                  │               │
      [Credentials Present in .env]               [No Credentials / Offline]
                                  │               │
                                  ▼               ▼
         ┌───────────────────────────────┐  ┌───────────────────────────────────┐
         │     Firebase Cloud Engine     │  │  Local Reactive Simulator Engine  │
         │  • Firebase Auth (Email/OAuth)│  │  • SessionStorage state store     │
         │  • Cloud Firestore Rules      │  │  • BroadcastChannel Pub/Sub bus   │
         │  • Cloud Functions (Node 20)  │  │  • Zero backend / instant testing │
         └───────────────────────────────┘  └───────────────────────────────────┘
```

1. **Firebase Production Engine**: Active when `VITE_FIREBASE_API_KEY` and project variables are configured in `.env`. Coordinates stream over Firestore snapshots, secured by granular access rules and backend Cloud Functions.
2. **Local Reactive Simulator Engine**: Active when Firebase environment variables are omitted or when the user selects "Demo Mode". Coordinates and session state stream across browser tabs in real time using the W3C `BroadcastChannel` API and `sessionStorage`.

---

## 4. Cryptographic Security Model

### Token Generation
Tokens are generated using cryptographically secure pseudorandom number generators (CSPRNG):
```typescript
// src/lib/crypto.ts
export function generateSecureToken(): string {
  const buffer = new Uint8Array(32); // 256 bits of cryptographic entropy
  window.crypto.getRandomValues(buffer);
  return Array.from(buffer).map((b) => b.toString(16).padStart(2, '0')).join('');
}
```
This produces a 64-character hexadecimal token possessing $2^{256}$ possible combinations, rendering brute-force or enumeration attacks mathematically infeasible.

### One-Way Hashing
The raw token is transmitted only in the share URL fragment/path (`/share/:token`). Before saving to Firestore or matching incoming requests:
```typescript
// src/lib/crypto.ts
export async function hashToken(rawToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawToken.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
```
Only `tokenHash` is written to database documents. If database records are leaked, raw access links cannot be reconstructed.

---

## 5. Prerequisites

- **Node.js**: `v20.x` or higher (verified compatible with Node 20, 22, and 24)
- **Package Manager**: `npm` v10+
- **Modern Web Browser**: Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge with support for:
  - W3C Geolocation API (`navigator.geolocation`)
  - Web Crypto API (`crypto.subtle` & `crypto.getRandomValues`)
  - Web BroadcastChannel API (`new BroadcastChannel(...)`)
- **HTTPS Context**: Geolocation API requires a Secure Context (`https://` or `localhost` / `127.0.0.1`).

---

## 6. Environment Variables & Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Required For |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | Production Firebase Mode |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain (`<project>.firebaseapp.com`) | Production Firebase Mode |
| `VITE_FIREBASE_PROJECT_ID` | Google Cloud / Firebase Project ID | Production Firebase Mode |
| `VITE_FIREBASE_STORAGE_BUCKET` | Cloud Storage Bucket ID | Production Firebase Mode |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging Sender ID | Production Firebase Mode |
| `VITE_FIREBASE_APP_ID` | Firebase Web App Application ID | Production Firebase Mode |

> ⚠️ **CRITICAL SECURITY NOTE**: Never store Firebase Admin private keys or service account credentials in frontend `.env` files. `VITE_` variables are public and bundled directly into client JavaScript.

---

## 7. Local Installation & Development

```bash
# 1. Clone repository
git clone https://github.com/your-username/locateflow.git
cd locateflow

# 2. Install client dependencies
npm install

# 3. Start development server
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## 8. Cross-Window Simulator Engine

LocateFlow includes an authentic local simulation engine (`src/services/demoStore.ts`). When testing locally without Firebase credentials:

- Sessions and coordinate packets are stored in `sessionStorage`.
- Updates are dispatched over a shared browser `BroadcastChannel("locateflow_channel")`.
- When an owner opens the dashboard in **Tab A** and opens a generated `/share/:token` link in **Tab B** (or an adjacent window), clicking "Share My Live Location" in Tab B immediately streams real-world or simulated coordinates to the Leaflet map in Tab A with zero external network dependencies.

---

## 9. Step-by-Step End-to-End Testing Workflows

Follow this sequence to test the entire lifecycle:

### Flow A: Generate Tracking Link
1. Navigate to `http://localhost:5173/login`.
2. Click **"Enter Demo Mode"** (or sign in with email/password if Firebase is configured).
3. From the dashboard, click **"Create Tracking Link"**.
4. Enter a session title (e.g., `Courier Express Delivery`) and optional instructions.
5. Click **"Generate Link"**.
6. The modal displays your 64-hex-character secure link with 24-hour expiration details.
7. Click **"Copy"** or click **"Test recipient view"**.

### Flow B: Open Recipient Consent Portal
1. Open a new browser window or tab.
2. Paste the URL: `http://localhost:5173/share/<token>`.
3. Verify that **NO geolocation prompt appears automatically**.
4. Review the consent panel:
   - Requester name (`LocateFlow User` or your account name)
   - Session purpose
   - Expiration countdown
   - Privacy guarantees

### Flow C: Grant Sovereign Consent
1. Click **"Share My Live Location"**.
2. The browser displays its native permission prompt: *"LocateFlow wants to know your location"*.
3. Click **"Allow"**.
4. The recipient view transitions to **Location Sharing Active** with a live pulsing indicator and mini map preview.

### Flow D: Verify Owner Real-Time Map
1. Switch back to the owner dashboard tab (`/dashboard/sessions/<id>`).
2. The interactive Leaflet map centers on the incoming coordinates.
3. Observe:
   - Pulsing radar marker with glow effect
   - Accuracy radius circle (e.g., $\pm 15$m)
   - Real-time telemetry card (Latitude, Longitude, Altitude, Speed, Accuracy, Satellite Time)
   - Camera following mode toggle (`Follow Camera`)
   - Map style toggle (Night Satellite vs Standard Terrain)

### Flow E: Stop Sharing by Recipient
1. On the recipient tab, click the red **"Stop Sharing Location"** button.
2. The recipient screen updates to *"Location Sharing Stopped"*, and GPS watching is immediately cancelled.
3. Switch to the owner dashboard: the session status updates to **Stopped**, coordinate streaming halts, and telemetry displays the final recorded position.

### Flow F: Revoke Session by Owner
1. On the owner dashboard, click **"Revoke Session"** in the top action bar.
2. Confirm the prompt.
3. The session is marked **Revoked**.
4. If the recipient refreshes or attempts to broadcast, the view displays *"Session Revoked. No coordinates are being tracked or stored."*

### Flow G: Expiration Rejection
1. Any session past its 24-hour timestamp (`Date.now() > session.expiresAt`) automatically marks itself expired.
2. The recipient page rejects consent, and the server/simulator discards subsequent coordinate packets.

---

## 10. Firebase Production Setup Guide

To transition from the local simulator to a production Google Cloud / Firebase deployment:

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/) and create a project named `locateflow-prod`.
2. **Enable Authentication**:
   - Navigate to **Authentication** > **Sign-in method**.
   - Enable **Email/Password** and **Google**.
3. **Create Cloud Firestore**:
   - Navigate to **Firestore Database** > **Create database**.
   - Select production mode and choose your primary region (e.g., `us-central1`).
4. **Register Web App**:
   - Navigate to Project Settings > General > Your apps > Web app `</>`.
   - Copy the configuration object values into your `.env` file.

---

## 11. Firestore Security Rules

LocateFlow ships with battle-tested security rules in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(ownerUid) {
      return isAuthenticated() && request.auth.uid == ownerUid;
    }

    function isValidCoordinate(data) {
      return data.latitude is number && data.latitude >= -90.0 && data.latitude <= 90.0
          && data.longitude is number && data.longitude >= -180.0 && data.longitude <= 180.0
          && data.accuracy is number && data.accuracy >= 0.0 && data.accuracy <= 100000.0;
    }

    // User documents
    match /users/{uid} {
      allow read, write: if isAuthenticated() && request.auth.uid == uid;
    }

    // Tracking Sessions
    match /trackingSessions/{sessionId} {
      allow read: if isOwner(resource.data.ownerUid)
                  || (resource.data.tokenHash != null);

      allow create: if isAuthenticated()
                    && request.resource.data.ownerUid == request.auth.uid
                    && request.resource.data.expiresAt <= request.resource.data.createdAt + (24 * 60 * 60 * 1000)
                    && request.resource.data.status == 'pending';

      allow update: if isOwner(resource.data.ownerUid)
                    || (
                      request.time.toMillis() < resource.data.expiresAt
                      && resource.data.status != 'revoked'
                      && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
                           'consentStatus', 'status', 'sharingStartedAt', 'sharingStoppedAt', 'lastUpdatedAt'
                         ])
                    );

      allow delete: if isOwner(resource.data.ownerUid);

      // Coordinate subcollection - OWNER ONLY READ
      match /location/current {
        allow read: if isOwner(get(/databases/$(database)/documents/trackingSessions/$(sessionId)).data.ownerUid);

        allow write: if let session = get(/databases/$(database)/documents/trackingSessions/$(sessionId)).data;
                     session.status == 'active'
                     && request.time.toMillis() < session.expiresAt
                     && session.status != 'revoked'
                     && isValidCoordinate(request.resource.data);
      }
    }
  }
}
```

Deploy the rules via the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 12. Cloud Functions Deployment

The `functions/` directory contains hardened Node.js 20 Cloud Functions verifying token hashes, executing coordinate bounding validation, and handling session status transitions:

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

Deployed Callable Functions:
- `validateShareToken`: Validates incoming raw token against SHA-256 hashes without leaking session ownership.
- `recordRecipientConsent`: Records explicit consent choice (`granted` | `declined`).
- `updateAuthorizedLocation`: Validates coordinate bounds with Zod (`-90 <= lat <= 90`, `-180 <= lng <= 180`, `accuracy >= 0`).
- `stopSharingRecipient`: Immediate recipient termination handler.
- `revokeSession`: Owner-authenticated revocation handler.

---

## 13. Production Build & Hosting

To compile the production client bundle:

```bash
npm run build
```

The optimized static assets will be output to `/dist`.

### Deploy to Firebase Hosting:
```bash
firebase deploy --only hosting
```

### Deploy to Vercel / Netlify:
Ensure the build command is set to `npm run build` and output directory is set to `dist`. Configure SPA rewrite rules (`/* -> /index.html`).

---

## 14. Automated Testing Suite

LocateFlow includes a comprehensive suite of unit and integration tests powered by **Vitest** and **React Testing Library**:

```bash
npm test
```

### Verified Test Coverage:
1. `src/test/crypto.test.ts`:
   - Cryptographic token entropy (32 bytes / 64 hex characters)
   - Uniqueness over 250 iterations
   - SHA-256 deterministic hash calculation
2. `src/test/validation.test.ts`:
   - Zod coordinate range validation (lat/lng/accuracy bounds)
   - Create session schema limits
3. `src/test/utils.test.ts`:
   - 24-hour expiration calculation & relative formatting
   - Coordinate string formatting (DMS / Decimal)
4. `src/test/demoStore.test.ts`:
   - In-memory session lifecycle
   - Coordinate transmission via Pub/Sub
   - Recipient cancellation and owner revocation
5. `src/test/RecipientConsent.test.ts`:
   - Verifies **no tracking starts on page load**
   - Verifies explicit button triggers `watchPosition`
   - Verifies stop sharing terminates watch immediately

---

## 15. Code Quality & Linting

LocateFlow enforces zero lint errors and zero warnings with **Oxlint**:

```bash
npx oxlint
```

Type-checking is enforced across the entire codebase:
```bash
npx tsc --noEmit
```

---

## 16. Browser Compatibility & Geolocation Constraints

- **Secure Context Requirement**: Modern browsers restrict the Geolocation API (`navigator.geolocation`) exclusively to Secure Contexts (`https://` or `localhost`). Accessing over unencrypted `http://` in production will be rejected by the browser.
- **Mobile Background Throttling**: Mobile browsers (Safari on iOS, Chrome on Android) throttle or suspend JavaScript timers and geolocation watching when the browser tab is backgrounded or screen locked. LocateFlow displays clear guidance for mobile recipients to keep the tab open for uninterrupted coordination.
- **High Accuracy Mode**: LocateFlow requests `enableHighAccuracy: true` with a 15-second timeout and 3-second maximum cache age to prioritize true hardware GPS over cell-tower estimation.

---

## 17. Live Telemetry & Stale Signal Detection

The live tracking map interface actively monitors transmission freshness:
- Coordinates updated within the last 15 seconds display a pulsing green **Broadcasting Live** badge.
- If no update has arrived in **> 45 seconds**, the interface displays an amber **Stale Signal Notice** indicating that the recipient may have encountered poor cellular coverage, entered a tunnel, or switched tabs.

---

## 18. Security Checklist & Compliance Verification

| Check | Status | Verification Detail |
| :--- | :---: | :--- |
| **No GPS on link open** | ✅ Verified | Unit tested in `RecipientConsent.test.tsx` |
| **No permission bypass** | ✅ Verified | Pure W3C `navigator.geolocation` invocation |
| **No IP fallback tracking** | ✅ Verified | Rejection preserves recipient privacy |
| **Visible Stop Sharing button** | ✅ Verified | Prominent in `RecipientConsentPage.tsx` |
| **Owner Revocation** | ✅ Verified | Revokes session instantly via Firestore/Store |
| **Hard 24-hour expiration** | ✅ Verified | Enforced in rules, Cloud Functions, and client |
| **Zero raw tokens in DB** | ✅ Verified | Only SHA-256 hashes persisted |
| **Owner-only coordinate reads** | ✅ Verified | Enforced via Firestore security rules |
| **Coordinate bounds validation** | ✅ Verified | Verified via Zod schema |
| **Zero frontend admin secrets** | ✅ Verified | Clean `.env.example` with public client keys only |

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
