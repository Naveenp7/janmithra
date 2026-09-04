# 🛠️ JanMithra — Complete Step-by-Step API & Environment Setup Guide
## Civic Issue Reporting System for Kerala Local Self-Governments (LSGs)

This guide walks you through setting up all third-party APIs (**Firebase**, **Cloudinary**, and **NVIDIA NIM**) and deploying the project locally or to **Vercel**.

---

## ⚡ Quick Start: Running the Project Locally

Thanks to the unified project architecture, both the React frontend and the Express AI backend run with a **single command**.

### 1. Install Dependencies
Open PowerShell or your terminal inside `c:\GUIDO\janmithra` and run:
```bash
npm install
```

### 2. Start Everything
Run the unified development script:
```bash
npm run dev
```
This runs:
- **API Server** on `http://localhost:5000` (handles NVIDIA NIM calls & health checks)
- **Vite React Client** on `http://localhost:5173` (with automatic `/api` proxying)

> **💡 Zero-Setup Demo Mode:**
> You can test the application **immediately** even before adding your external API keys! The app includes high-fidelity local reactive storage, 1-click demo logins for both Citizen and Admin roles, and an intelligent civic heuristic engine that auto-classifies complaints if NVIDIA keys are pending.

---

## 📋 Table of Contents
1. [Firebase Setup (Authentication + Firestore Database)](#1-firebase-setup)
2. [Cloudinary Setup (Unsigned Image Upload Preset)](#2-cloudinary-setup)
3. [NVIDIA NIM AI Setup (Free-Tier LLM Inference)](#3-nvidia-nim-setup)
4. [Configuring Environment Variables (`.env`)](#4-environment-variables-setup)
5. [Vercel 1-Click Deployment](#5-vercel-deployment)
6. [Testing the End-to-End Demo Flow](#6-testing-the-end-to-end-demo-flow)

---

## 1. Firebase Setup

Firebase powers user authentication (Citizen & Admin) and the real-time Firestore database for complaints.

### Step 1.1: Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/) and sign in with your Google account.
2. Click **Add project** (or **Create a project**).
3. Name your project: `janmithra-kerala-civic` (or any name you prefer).
4. (Optional) Disable Google Analytics for this demo to save time, then click **Create Project**.

### Step 1.2: Enable Authentication Providers
1. In the left navigation menu, click **Build** > **Authentication**, then click **Get started**.
2. Under the **Sign-in method** tab:
   - Click **Email/Password** > Enable the first toggle (**Email/Password**) > Click **Save**.
   - Click **Add new provider** > Select **Google** > Enable toggle > Set your support email > Click **Save**.

### Step 1.3: Enable Cloud Firestore Database
1. In the left menu, click **Build** > **Firestore Database**, then click **Create database**.
2. Choose your database location (e.g. `asia-south1` Mumbai for fastest latency in India).
3. Select **Start in test mode** (this allows read/write access for your demo build), then click **Create**.
4. *(Optional)* If you want specific security rules later, paste this into the **Rules** tab and click **Publish**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true; // Open for Phase 1 demo testing
       }
     }
   }
   ```

### Step 1.4: Register Web App & Get Configuration Keys
1. In the Firebase Console, click the **Project settings** (gear icon ⚙️ near top-left).
2. Under the **General** tab, scroll down to **Your apps** and click the **Web icon (`</>`)**.
3. Register app nickname: `JanMithra Web` (do not check Firebase Hosting for now), then click **Register app**.
4. You will see a `firebaseConfig` object containing:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "janmithra-kerala-civic.firebaseapp.com",
     projectId: "janmithra-kerala-civic",
     storageBucket: "janmithra-kerala-civic.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef..."
   };
   ```
5. Copy these values into your `.env` file (see [Section 4](#4-environment-variables-setup)).

---

## 2. Cloudinary Setup

Cloudinary provides image storage for photo evidence uploaded by citizens. Using an **Unsigned Upload Preset** lets the frontend upload directly to Cloudinary without exposing backend secrets.

### Step 2.1: Create a Free Account
1. Visit [Cloudinary Sign Up](https://cloudinary.com/users/register_free) and create a free account.
2. Once logged into the **Cloudinary Console / Dashboard**, note your **Cloud Name** displayed at the top.

### Step 2.2: Create an Unsigned Upload Preset
1. Click the **Settings (gear icon ⚙️)** at the bottom-left of the Cloudinary dashboard.
2. In the Settings menu, navigate to **Upload** (or **Upload Presets**).
3. Scroll down to the **Upload presets** section and click **Add upload preset**.
4. Configure the preset:
   - **Upload preset name**: Enter `janmithra_unsigned` (or any name you prefer).
   - **Signing Mode**: Change from *Signed* to **Unsigned** (⚠️ *Critical step*).
   - **Folder**: Optional (e.g. `janmithra_complaints`).
5. Click **Save** at the top-right.
6. Note down:
   - Your **Cloud Name**
   - Your **Upload Preset Name** (e.g. `janmithra_unsigned`)

---

## 3. NVIDIA NIM Setup

NVIDIA NIM provides hosted inference endpoints (such as `meta/llama-3.1-8b-instruct`) with free inference credits for AI classification of civic issues.

### Step 3.1: Get Your Free NVIDIA NIM API Key
1. Go to [NVIDIA API Catalog](https://build.nvidia.com/).
2. Click **Sign In** / **Join the Developer Program** at the top-right (free with email or Google).
3. Search or browse for **`meta/llama-3.1-8b-instruct`** (or `nvidia/llama-3.1-nemotron-70b-instruct`).
4. On the model page, click **Get API Key** (or **Generate Key**).
5. Copy the generated key (starts with `nvapi-...`).
   > *Keep this key private. It is only read by your backend/serverless function and never sent to the client browser.*

---

## 4. Environment Variables Setup

Create or edit `.env` in the root folder (`c:\GUIDO\janmithra\.env`):

```ini
# ================================================================
# JanMithra Civic Issue Reporting System — Environment Config
# ================================================================

# --- Server & NVIDIA NIM Configuration ---
PORT=5000
NIM_API_KEY=nvapi-your-real-nvidia-nim-key-here
NIM_MODEL=meta/llama-3.1-8b-instruct

# --- Frontend Firebase Configuration ---
VITE_FIREBASE_API_KEY=AIzaSy...your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=janmithra-kerala.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=janmithra-kerala
VITE_FIREBASE_STORAGE_BUCKET=janmithra-kerala.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef

# --- Frontend Cloudinary Configuration ---
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=janmithra_unsigned

# --- Optional Custom API Base (leave blank for local Vite proxy / Vercel relative path) ---
VITE_API_BASE_URL=
```

---

## 5. Vercel Deployment

This project is built to deploy to Vercel as a **single unified project** with zero complex setup.

### How it works:
- React (Vite) builds static assets into `dist/`.
- The `api/classify-complaint.js` and `api/health.js` files automatically become Vercel Serverless API routes (`/api/*`).
- `vercel.json` takes care of Single Page App (SPA) URL rewrites.

### Deployment Steps:
1. Push your repository to GitHub / GitLab.
2. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New... > Project**.
3. Import your repository (`janmithra`).
4. Framework Preset: Vercel will automatically detect **Vite**.
5. Under **Environment Variables**, add the exact keys from your `.env`:
   - `NIM_API_KEY`
   - `NIM_MODEL`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
6. Click **Deploy**. Vercel will build and launch your live URL in ~45 seconds!

---

## 6. Testing the End-to-End Flow with Real Authentication

Follow this checklist to test the full live system with Firebase Authentication:

1. **Start the App:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

2. **Register & Sign In as an LSG Authority (Admin):**
   - Click **Authority View** in the top right (or navigate to `http://localhost:5173/admin/login`).
   - Click the **Register Officer** tab.
   - Enter your official details:
     - Name: e.g. `K. S. Narayanan`
     - Department: e.g. `Road Infrastructure` (or your choice)
     - LSGD Security Key: `LSG-KERALA-ADMIN`
     - Email: `officer@lsg.kerala.gov.in`
     - Password: `password123`
   - Click **Register Authority Account**.
   - You are now logged in as an official administrator in the **Authority Dashboard** (`/admin`).
   - Notice the database starts completely clean with 0 complaints.
   - Click **Field Staff** to view or add municipal engineers for task dispatching.

3. **Register & Sign In as a Citizen:**
   - In a private/incognito window (or after signing out), go to `http://localhost:5173/citizen/login`.
   - You can sign in using **Continue with Google** or click **Register Account** with Email/Password.
   - Fill in your citizen name, email, and password, then click **Create Citizen Account**.
   - You will be redirected to the **Report a Civic Issue** page (`/citizen`).

4. **Submit a Real Civic Complaint:**
   - Type your issue description (e.g. *"Deep pothole on MG Road near Metro pillar 45 causing two-wheelers to skid"*).
   - Click **Preview AI Triage** to watch the NVIDIA NIM neural model analyze category, urgency, and reasoning.
   - Attach a photographic verification of the problem.
   - Pin your location on the Leaflet map or click **Use My Current GPS**.
   - Click **Submit Official Complaint to LSG Portal**.
   - You are automatically redirected to the **Complaint Detail** page showing your real-time 4-step resolution timeline.

5. **Watch Real-Time Status Synchronization Across Windows:**
   - Switch back to the Authority Dashboard window (`http://localhost:5173/admin`).
   - The newly submitted complaint appears in the table and on the GIS Map instantly via Firestore `onSnapshot`.
   - Click **Manage** on the complaint.
   - Assign a field engineer (e.g. *Rajesh Kumar - Road*) and set the status to **In Progress**.
   - Click **Save & Broadcast Update**.
   - Look back at your Citizen window: **The status timeline changes to "In Progress" with the assigned engineer without any manual page refresh!**

6. **Explore GIS Map & Analytics:**
   - Click **GIS Map** (`/admin/map`) to view pins plotted across Kerala, color-coded by urgency (*Red = Critical, Orange = High, Yellow = Medium, Low = Green*).
   - Click **Analytics** (`/admin/analytics`) to see Recharts update dynamically with real departmental statistics.
