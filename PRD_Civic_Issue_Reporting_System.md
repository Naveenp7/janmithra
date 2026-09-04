# Product Requirements Document (PRD)
## AI-Powered Civic Issue Reporting System for Kerala's Local Self-Governments

**Version:** 1.0
**Author:** Naveen
**Date:** September 2026
**Status:** Draft — MVP Planning

---

## 1. Overview

### 1.1 What is this product?
A web/mobile platform that lets citizens report civic problems (potholes, garbage, broken streetlights, water leaks, etc.) using **text, voice, images, or video**. An AI layer automatically reads, classifies, and prioritizes these complaints, then routes them to the right municipal worker — while giving local government officials a real-time dashboard to monitor everything, and giving citizens live updates on their complaint status.

### 1.2 Problem Statement
Local Self-Governments (LSGs) in Kerala currently rely on manual, fragmented complaint systems (phone calls, paper forms, WhatsApp groups). This causes:
- Delayed issue resolution
- No visibility into complaint status for citizens
- Duplicate complaints wasting worker time
- No data-driven way to spot recurring problem "hotspots"
- No accountability/audit trail for authorities

### 1.3 Goal
Build an intelligent, low-cost, easy-to-deploy system that automates complaint intake, classification, routing, and tracking — improving transparency and response time for civic issues.

### 1.4 Guiding Principle
Keep it **simple, free-tier friendly, and buildable by a solo developer**, using Firebase, Cloudinary, and free LLM inference (NVIDIA NIM) instead of expensive custom-hosted ML infrastructure — while still delivering "AI-native" functionality.

---

## 2. Users & Roles

| Role | Description |
|---|---|
| **Citizen** | Reports issues, tracks status, validates fixes, rates service |
| **Field Worker** | Receives assigned tasks, updates progress, marks resolution |
| **LSG Authority/Admin** | Monitors dashboard, manages workers, oversees SLA compliance |
| **System (AI)** | Classifies, deduplicates, prioritizes, and routes complaints automatically |

---

## 3. High-Level Architecture (mapped to your stack)

```
[Citizen App/Web] 
      ↓
[Firebase Auth] → [Cloudinary (media storage)] → [NVIDIA NIM (AI processing)]
      ↓
[Firestore Database] ←→ [AI Decision Engine (Cloud Functions / Node backend)]
      ↓
[GIS & Analytics Layer] → [Resource/Worker Assignment Engine]
      ↓
[Authority Dashboard]  ←→  [Citizen App (status updates)]
```

- **Firebase Authentication** → citizen, worker, and admin login (phone/email/Google)
- **Cloud Firestore** → all structured data: complaints, users, workers, audit logs
- **Cloudinary** → stores uploaded images/videos/voice notes, returns URLs
- **NVIDIA NIM (free-tier hosted models)** → replaces the heavier local ML stack (Whisper/BERT/YOLO/SBERT/XGBoost/Isolation Forest) with hosted inference calls — detailed mapping in Section 5.

---

## 4. Feature List (from your architecture diagram)

### 4.1 Citizen Interface — Multimodal Input
- [ ] Submit complaint via **Text**
- [ ] Submit complaint via **Voice** (record in-app, upload to Cloudinary)
- [ ] Submit complaint via **Image** (photo of the issue)
- [ ] Submit complaint via **Video** (short clip)
- [ ] Auto-capture **GPS location** with each complaint
- [ ] Multi-language support (Malayalam + English) — stretch goal

### 4.2 Multimodal Processing Layer
- [ ] **Speech-to-Text (ASR):** convert voice complaints into text
- [ ] **NLP:** clean/understand the text complaint (language detection, translation if needed)
- [ ] **Computer Vision:** analyze uploaded images/video frames to detect the type of issue (e.g., pothole, garbage pile, broken light)

### 4.3 AI Decision Intelligence Engine
- [ ] **Issue Classification** — auto-tag complaint category (road, water, electricity, waste, drainage, etc.)
- [ ] **Duplicate Complaint Detection** — check if a similar complaint already exists nearby (semantic similarity)
- [ ] **Urgency Prediction** — score complaint priority (Low / Medium / High / Critical)
- [ ] **Fraud & Abuse Detection** — flag spam, fake, or repeated abusive submissions
- [ ] **Explainable AI (XAI)** — show *why* the AI classified/prioritized a complaint the way it did (simple reason string, not a black box)

### 4.4 GIS & Analytics Module
- [ ] **GIS Hotspot Mapping** — visualize complaint density on a map (e.g., using Leaflet/Mapbox with Firestore geo-queries)
- [ ] **Predictive Civic Issue Forecasting** — basic trend detection (e.g., "Ward 5 has 3x more drainage complaints in monsoon season")
- [ ] **Preventive Maintenance Recommendations** — simple rule-based or LLM-generated suggestions based on hotspot trends

### 4.5 Resource Management & Optimization
- [ ] **Intelligent Worker Assignment** — auto-assign the nearest available worker with matching skill/department
- [ ] **Dynamic Route Optimization** — suggest efficient order of visits for a worker's daily tasks
- [ ] **SLA Monitoring & Auto-Escalation** — track deadlines per issue category; auto-escalate to a supervisor if overdue

### 4.6 Authority Dashboard
- [ ] Digital Twin–style overview of all live complaints on a map
- [ ] Real-time monitoring feed
- [ ] Performance analytics (resolution time, worker performance, category breakdown)
- [ ] Audit trail & reports (who did what, when)
- [ ] Decision support panel (AI-suggested actions/insights)

### 4.7 Citizen Services
- [ ] Complaint tracking (status: Submitted → Assigned → In Progress → Resolved)
- [ ] Real-time notifications (push/SMS/email on status change)
- [ ] Community validation (citizens confirm if a "resolved" issue is actually fixed)
- [ ] Feedback & rating system per resolved complaint
- [ ] Transparency page — public stats per ward/area

### 4.8 Data Management & Storage
- [ ] Complaint Database (Firestore)
- [ ] User Database (Firestore, linked to Firebase Auth)
- [ ] Worker Database (Firestore)
- [ ] Audit Logs & Records (Firestore, append-only collection)

---

## 5. AI Model Mapping — Original Diagram vs Your Actual Stack

Your original architecture named specific models (Whisper, BERT, YOLO, SBERT, XGBoost, Isolation Forest). Since you're using **NVIDIA NIM free-tier hosted models**, here's how each feature maps realistically:

| Original Diagram Model | Purpose | Your Implementation via NVIDIA NIM |
|---|---|---|
| Whisper (ASR) | Voice-to-text | NIM-hosted ASR/speech model (or fallback: browser-native Web Speech API to save API calls) |
| BERT (classification) | Issue category tagging | NIM-hosted LLM (e.g., Llama 3 NIM) prompted to classify complaint text into fixed categories |
| YOLO (image analysis) | Detect issue type in photo | NIM-hosted vision-language model (e.g., a multimodal NIM model) prompted to describe/classify the image |
| SBERT (duplicate detection) | Semantic similarity | Use NIM embeddings endpoint (if available) or an LLM prompt comparing new complaint text to nearby existing complaints (fetched via Firestore geo-query) |
| XGBoost (urgency prediction) | Priority scoring | Prompt-based scoring via NIM LLM using a structured rubric (category + keywords + duplicate count → urgency score), OR a lightweight rule-based scorer for MVP |
| Isolation Forest (fraud detection) | Anomaly/spam detection | Simple rule-based checks for MVP (rate limits, duplicate account flags, image blur/spam detection) + optional LLM-based content moderation via NIM |

**Note for MVP:** Not all six models need to be "real" ML on day one. Several can start as **prompt-engineered LLM calls** to a single NVIDIA NIM model, which keeps the system simple and free while still delivering the intelligent behavior described in your diagram. You can swap in specialized models later as the project matures.

---

## 6. Core Data Model (Firestore Collections — simplified)

**`complaints`**
```
{
  complaintId, citizenId, category, description,
  mediaUrls: [cloudinary links],
  mediaType: text|voice|image|video,
  location: { lat, lng, ward },
  status: submitted|assigned|in_progress|resolved|escalated,
  urgencyScore, isDuplicateOf, isFlagged,
  assignedWorkerId, slaDeadline,
  createdAt, updatedAt
}
```

**`users`**
```
{ userId, name, phone, role: citizen|worker|admin, ward, createdAt }
```

**`workers`**
```
{ workerId, name, department, currentLocation, availability, activeTaskIds }
```

**`auditLogs`**
```
{ logId, actorId, action, targetComplaintId, timestamp }
```

---

## 7. MVP Scope (Phase 1 — What to build first)

To avoid overbuilding, here's a realistic MVP cut:

✅ Include in MVP:
- Text + image complaint submission (voice/video can come later)
- Firebase Auth (citizen + admin login)
- Cloudinary media upload
- NVIDIA NIM-based category classification + urgency scoring
- Basic duplicate check (geo + text similarity via LLM prompt)
- Complaint status tracking for citizens
- Simple map view (hotspot pins) for admin
- Manual or basic auto worker assignment
- Admin dashboard: list + map + status filters

🚫 Defer to Phase 2:
- Voice & video processing
- Route optimization
- Predictive forecasting
- Fraud/anomaly detection model
- Multi-language support
- SLA auto-escalation automation

---

## 8. Non-Functional Requirements
- **Cost:** Must run within Firebase free tier (Spark plan) + Cloudinary free tier + NVIDIA NIM free API limits
- **Performance:** Complaint classification should return within ~3–5 seconds
- **Scalability:** Firestore structure should support pagination and ward-level filtering as data grows
- **Security:** Firebase Auth rules to ensure citizens can only edit their own complaints; admins have elevated read access
- **Usability:** Mobile-first UI, minimal steps to file a complaint (ideally under 60 seconds)

---

## 9. Success Metrics
- Average complaint resolution time (before vs after system)
- % of complaints auto-classified correctly (spot-checked manually)
- Duplicate complaint reduction rate
- Citizen satisfaction rating (post-resolution feedback)
- SLA compliance rate per department

---

## 10. Risks & Assumptions
- NVIDIA NIM free-tier rate limits may require queuing/caching for high complaint volume
- LLM-based classification may need prompt-tuning to reach acceptable accuracy without a fine-tuned model
- GIS features depend on citizens granting location permission
- Real deployment with an actual LSG would require government partnership/approval — out of scope for MVP demo

---

## 11. Suggested Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React / React Native (or Flutter, if preferred) |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Media Storage | Cloudinary |
| AI/LLM | NVIDIA NIM (free-tier hosted models) |
| Maps | Leaflet.js / Mapbox (free tier) |
| Backend Logic | Firebase Cloud Functions (Node.js) |
| Hosting | Firebase Hosting / Vercel |

---

## 12. Next Steps
1. Finalize MVP feature list (Section 7)
2. Design Firestore schema in detail
3. Set up Firebase project + Cloudinary account + NVIDIA NIM API access
4. Build citizen complaint submission flow first (highest priority, most visible)
5. Build admin dashboard with map view
6. Layer in AI classification once submission flow works end-to-end
