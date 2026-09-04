# JanMithra (ജനമിത്ര) — Civic Issue Reporting System
### AI-Powered Civic Triage & Real-Time Resolution Platform for Kerala's Local Self-Governments (LSGs)

**JanMithra** connects citizens and local municipal authorities across Kerala. Citizens report civic issues (potholes, water pipeline bursts, dangling live wires, garbage dumping, clogged drainage) using text, photos, and geospatial pins. An AI triage engine automatically categorizes issues and scores urgency using **NVIDIA NIM LLM inference**, while municipal administrators track, assign, and resolve complaints on real-time dashboards and GIS maps.

---

## 🚀 Key Highlights & Real Authentication Architecture

1. **Citizen Portal (`/citizen`)**:
   - Real Firebase Authentication: Email/Password registration & sign-in, and Google Sign-In (`select_account` prompt).
   - Citizen records stored in Firestore `users` collection (`role: "citizen"`).
   - Multimodal issue reporting: real text input, photographic verification via Cloudinary, and Leaflet GPS location picker.
   - Real-time AI classification triage powered by NVIDIA NIM (`meta/llama-3.1-8b-instruct`).
   - "My Complaints" list strictly filtered by authenticated citizen's UID.
   - Interactive 4-step live resolution timeline (*Submitted ➜ Assigned ➜ In Progress ➜ Resolved*), reacting instantaneously via Firestore `onSnapshot`.

2. **Government Authority Portal (`/admin`)**:
   - Role-protected executive console: only authenticated users with `role: "admin"` in Firestore can access.
   - Officer Registration & Login with departmental assignment (Road, Water, Electricity, Waste, Drainage, General).
   - Real-time complaints dashboard with zero fake/mock complaints — only genuine issues submitted by registered citizens appear.
   - Field Staff Management: view and register municipal engineers into the Firestore `workers` collection.
   - Kerala GIS map with Leaflet OpenStreetMap tiles and urgency color-coded pins (*Critical=Red, High=Orange, Medium=Yellow, Low=Green*).
   - Complaint inspection modal to assign field workers and update resolution lifecycle states.
   - Recharts visual analytics (category breakdown bar charts, status donut charts) calculated on real database entries.

3. **Unified Single-Project Architecture**:
   - Single `package.json` at root — run everything with `npm run dev`.
   - Vercel-ready with serverless `/api` routes and `vercel.json` SPA configuration.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Lucide Icons |
| Backend & AI Server | Node.js, Express (local dev) + Vercel Serverless Functions (`/api/*`) |
| AI / LLM Engine | NVIDIA NIM API (`meta/llama-3.1-8b-instruct`) with civic heuristic fallback |
| Database & Real-Time Sync | Firebase Cloud Firestore (`onSnapshot` live listeners) |
| User Authentication | Firebase Auth (Email/Password + Google Sign-In) + Demo Quick-Switch |
| Media Storage | Cloudinary (Direct Unsigned Upload Preset) |
| Geospatial GIS Mapping | Leaflet.js, React-Leaflet, OpenStreetMap tiles |
| Analytics & Charts | Recharts |

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run both frontend and backend concurrently
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

- Citizen Portal: `http://localhost:5173/citizen`
- Authority Portal: `http://localhost:5173/admin`

---

## 📖 API Setup & Configuration

For comprehensive step-by-step instructions on obtaining and setting up your **Firebase**, **Cloudinary**, and **NVIDIA NIM** API keys, read the dedicated guide:

👉 **[SETUP_GUIDE.md](file:///c:/GUIDO/janmithra/SETUP_GUIDE.md)**

---

## 📁 Repository Structure

```
c:\GUIDO\janmithra/
├── index.html                 # HTML entry with Google Fonts & Leaflet styles
├── package.json               # Unified frontend + backend scripts & dependencies
├── vite.config.js             # Vite configuration with /api proxy to port 5000
├── tailwind.config.js         # Tailwind CSS styling tokens
├── postcss.config.js          # PostCSS configuration
├── vercel.json                # Vercel serverless deployment rules
├── server.js                  # Express API server for local dev (port 5000)
├── api/                       # Vercel Serverless Functions
│   ├── classify-complaint.js  # POST /api/classify-complaint (calls NVIDIA NIM)
│   ├── health.js              # GET /api/health
│   └── _classifier.js         # Shared NIM AI triage & heuristic engine
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── context/
│   │   └── AuthContext.jsx    # Role-based authentication & demo accounts
│   ├── services/
│   │   ├── firebase.js        # Firestore real-time sync & local store fallback
│   │   ├── cloudinary.js      # Direct unsigned photo uploads
│   │   ├── api.js             # AI classification & server connectivity
│   │   └── seedData.js        # LSG field workers & sample Kerala complaints
│   ├── components/
│   │   ├── Navbar.jsx         # Unified header with portal switcher
│   │   ├── StatusBadge.jsx    # Status chip indicators
│   │   ├── UrgencyBadge.jsx   # Urgency badges (Critical, High, Medium, Low)
│   │   ├── LocationPicker.jsx # Leaflet map with GPS & manual pin drop
│   │   ├── ComplaintCard.jsx  # Reusable complaint card
│   │   └── DemoNotice.jsx     # Non-intrusive API status indicator & modal
│   └── pages/
│       ├── citizen/           # Citizen Portal (Auth, Submit, MyComplaints, Detail)
│       └── admin/             # Authority Portal (Auth, Dashboard, GIS Map, Analytics)
├── .env.example               # Template for all environment variables
├── .env                       # Local environment variables
├── SETUP_GUIDE.md             # Detailed API setup guide
└── README.md
```
