### 1. What is the difference between a normal complaint registration website and the JanMithra project?
A traditional complaint website is just a static online form. When a citizen submits a complaint, a human operator must manually open it, read it, decide which department handles it, and manually judge how urgent it is. This leads to heavy delays and human error.

**JanMithra** is an intelligent, AI-powered system:
- **Instant AI Triage:** As soon as an issue is submitted, AI automatically identifies the department (Road, Water, Electricity, Waste, Drainage), calculates the urgency level (Critical, High, Medium, Low), and provides a reason.
- **Computer Vision:** Citizens can submit reports using only a photograph; the AI inspects the photo directly.
- **Geospatial Tracking:** Issues are automatically plotted on an interactive GIS map.
- **Real-Time Live Updates:** Uses database listeners so citizens see status changes (Submitted → Assigned → In Progress → Resolved) instantly without refreshing the page.

---

### 2. How is AI used in this project?
AI works as an **automated civic triage assistant**. It analyzes the complaint data (text description and uploaded photographs) to:
1. Determine the correct municipal department.
2. Calculate the public safety risk (urgency priority).
3. Generate an "Explainable AI (XAI)" sentence explaining why it assigned that priority.

---

### 3. Where is AI used in this project?
AI is integrated into the **issue intake and submission pipeline**:
- In the citizen portal at `/citizen`, users can click **"Preview AI Triage"** to see live AI predictions before submitting.
- On final submission, the backend serverless endpoint (`/api/classify-complaint`) invokes the **Gemini** model to classify the issue before storing it in the database.

---

### 4. What are the future applications and benefits of this project?
**Benefits:**
- Eliminates paperwork and administrative bottlenecks.
- Gives top priority to life-threatening issues (like live electric wires).
- Provides total transparency so citizens know exactly who is fixing their issue.

**Future Applications:**
- **Voice-to-Text Reporting:** Allowing citizens to speak their issue in regional languages (e.g., Malayalam).
- **Automated Worker Proximity Dispatch:** Automatically dispatching the closest available engineer using GPS routing.
- **Predictive Analytics:** Forecasting seasonal civic problems (e.g., clogged storm drains before monsoon seasons).
- **Public Transparency Scorecards:** Public ward ratings showing resolution speeds of local authorities.

---

### 5. What are the limitations of this project?
- **Internet & Device Dependency:** Requires an internet connection and a smartphone or computer with browser GPS support.
- **Cloud API Quotas:** High traffic requires active API limits on Cloudinary and Gemini (though Janmithra has a built-in local fallback engine if keys run out).
- **Physical Verification:** While AI can detect visible damage from a photo, complex underground issues (like an internal pipe fracture) still require physical inspection.

---

### 6. Why did you choose this project?
In many cities and towns, common public hazards—such as dangerous potholes, dangling electric wires, contaminated water, and garbage overflow—remain unaddressed for weeks simply because manual complaint reporting is slow, bureaucratic, and lacks accountability. 

We chose JanMithra to demonstrate how modern, accessible web technologies, cloud databases, and lightweight AI models can automate municipal management, protect public safety, and give citizens a direct, transparent voice.

---

### 7. What does a duplicate complaint mean in this project?
A **duplicate complaint** occurs when multiple citizens report the exact same problem—for example, five different people taking pictures of the same pothole on the same street corner. 

In the system, duplicate detection identifies reports that share the same category, geographic location (within a 50-meter radius), and time frame. Grouping duplicates prevents municipal teams from sending multiple repair crews to the same spot.

---

### 8. What features are currently implemented and working on the website?
1. **Authentication System:** Secure email/password and Google Sign-In with role separation for Citizens and Administrators.
2. **Flexible Reporting:** File complaints using text description, on-site photographs, or photo-only evidence.
3. **Client-Side Image Optimization:** Automatically resizes and compresses photos in the browser before uploading to save user data.
4. **Interactive Leaflet GIS Map:** Allows citizens to drop a pin, use device GPS, or use quick-jump district buttons with reverse geocoding.
5. **Multimodal AI Classification:** Powered by Google Gemini (`gemini-3.5-flash-lite`) with a built-in local rule fallback.
6. **Real-Time Live Sync:** Citizen tracker (`/citizen/my-complaints`) and 4-step progress timeline update live via Cloud Firestore listeners (`onSnapshot`).
7. **Authority Dashboard:** Live KPI counters, category/urgency filters, mobile-friendly cards, and desktop data table.
8. **Field Staff Registry & Task Assignment:** Officers can view engineers and assign them to specific complaints.
9. **GIS Hotspot Map:** Urgency-colored pins (Red for Critical, Orange for High, Amber for Medium, Green for Low) plotted on OpenStreetMap.

---

### 9. What are the remaining features or tasks to be completed in this project?
The following features are roadmapped for Phase 2:
- **Speech-to-Text Voice Intake:** In-app audio recording for citizens who prefer speaking over typing.
- **Video Clip Uploads:** Ability to attach short 5-second video clips.
- **Automated Proximity Dispatch:** Haversine distance algorithm to automatically assign the nearest worker.
- **SLA Auto-Escalation Timers:** Automatically alert higher supervisors if a critical issue is not resolved within 24 hours.
- **Full Malayalam UI Localization:** A language switcher for complete Malayalam text throughout the application.

---

### 10. Where is the complaint data stored after a complaint is registered?
- **Structured Data:** The text, location coordinates, ward name, urgency level, category, assigned worker, status, and timestamps are stored in **Google Cloud Firestore** (a cloud NoSQL database).
- **Photographs:** The actual image files are stored in **Cloudinary Media Cloud CDN**, and the resulting secure image URL is saved inside the Firestore complaint document.

---

### 11. What technologies are used for the frontend and backend?
- **Frontend:**
  - **React 18** (User interface library)
  - **Vite 5** (Fast build tool and dev server)
  - **Tailwind CSS** (Modern utility-first styling)
  - **Lucide React** (Vector icons)
  - **Leaflet & React-Leaflet** (Interactive maps with OpenStreetMap tiles)
  - **Recharts** (Data analytics charts)
- **Backend & Cloud:**
  - **Node.js & Express** (Local backend server and API proxy)
  - **Vercel Serverless Functions** (Production `/api/*` endpoints)
  - **Firebase Authentication** (User identity management)
  - **Google Cloud Firestore** (Real-time NoSQL database)
  - **Cloudinary** (Direct browser photo storage)
  - **Google Gemini API** (Multimodal LLM inference)

---

### 12. What is Janmithra?
**JanMithra** (derived from words meaning *"Friend of the People"*) is an AI-powered civic issue reporting and municipal resolution tracking platform. It allows citizens to easily report neighborhood problems and enables municipal authorities to review, prioritize, and resolve those issues with speed and transparency.

---

### 13. How did you develop this website?
1. **Requirements & Architecture:** Defined the user flows for both citizens and authorities based on a detailed Product Requirements Document (PRD).
2. **Frontend Construction:** Built modern, responsive interfaces using React, Vite, and Tailwind CSS.
3. **Mapping & Geolocation:** Integrated Leaflet.js with browser Geolocation API and OpenStreetMap Nominatim reverse geocoding.
4. **Cloud Integration:** Integrated Firebase for real-time Firestore database synchronization and secure user authentication, plus Cloudinary for direct image uploads.
5. **AI Integration:** Implemented the `/api/classify-complaint` endpoint connecting to Gemini's multimodal vision Language models with a local heuristic fallback engine.
6. **Mobile Optimization & Refactoring:** Refined the UI for touchscreens, mobile cards, and cleaned up debug code for production deployment.

---

### 14. What are the responsibilities of the admin in this project?
- Monitor incoming civic reports in real-time on the executive dashboard.
- Review AI-assigned categories, urgency scores, and attached photos.
- Override or update categories and priority levels if necessary.
- Maintain the municipal field worker registry (adding workers and their specialties).
- Assign field engineers to complaints.
- Progress complaints through the resolution lifecycle: *Submitted → Assigned → In Progress → Resolved*.

---

### 15. Who are the intended users of this website?
1. **Citizens:** Residents who encounter road damage, water leaks, uncollected trash, or electrical dangers and want them fixed quickly.
2. **Municipal Officers / Administrators:** Supervisors who manage city wards, track statistics, and allocate staff.
3. **Field Staff / Municipal Engineers:** Field workers who receive work orders with exact GPS locations and photo evidence to carry out repairs.

---

### 16. When a user uploads a photo, how does AI automatically generate a description, and how does the system process the complaint further?
1. **Direct Upload:** The citizen attaches a photo; the browser compresses it and uploads it to Cloudinary, generating a public image URL.
2. **Multimodal Inspection:** The backend sends the image URL to the **Gemini 3.5 Flash-Lite** vision model.
3. **Visual Extraction:** The model inspects the pixels to recognize physical objects (e.g., cracked tarmac, water pooling, garbage pile, snapped electrical wire).
4. **Classification & Reasoning:** The AI generates structured JSON containing the category, urgency rating, and a 1-sentence reasoning statement.
5. **Database Storage & Dispatch:** The record is saved in Firestore, which immediately triggers the real-time listener on the admin dashboard for officer assignment.

---

### 17. How do you run this website?
To run JanMithra locally on your machine:
```bash
# 1. Open the project directory
cd c:\GUIDO\janmithra

# 2. Install dependencies
npm install

# 3. Create your .env file with your API keys (Firebase, Cloudinary, Gemini)
copy .env.example .env

# 4. Start both frontend and backend concurrently
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

### 18. After a complaint is registered, where does the data go, and how is it processed?
1. **Client Browser:** Validates the input, optimizes photo data, and uploads photo evidence directly to Cloudinary.
2. **AI API Route:** Dispatches the data to `/api/classify-complaint` where Gemini scores urgency and determines the municipal department.
3. **Database Write:** A new document is created in the `complaints` collection of Google Cloud Firestore.
4. **Real-Time Push:** Firestore's WebSocket connection (`onSnapshot`) broadcasts the new complaint to all active admin and citizen screens without requiring anyone to refresh their browser.

---

### 19. Where is the website hosted?
- **Web App & Serverless Backend:** Deployed and hosted on **Vercel** ([janmithra-tau.vercel.app](https://janmithra-tau.vercel.app/)).
- **Database & Auth:** Hosted globally on **Google Cloud Platform (Firebase)**.
- **Media CDN:** Hosted on **Cloudinary Media Cloud**.

---

### 20. How does AI understand the complaint submitted by a user?
The AI relies on a **Multimodal Large Language Model (MLLM)**:
- **For Text:** It breaks sentences into mathematical tokens, analyzes the context and semantic meaning, and detects key phrases (e.g., *"sparking wire"* or *"pipe burst"*).
- **For Images:** A vision transformer converts image patches into embeddings, allowing the model to "see" real-world civic damage and correlate it with the text description.

---

### 21. If ten people register complaints about the same issue, how does the system handle them?
When multiple citizens report the same issue simultaneously, the system manages both the user experience and database concurrency:

- **Current Implementation:** Each report is logged with its own timestamp, authenticated citizen ID, and GPS coordinates so no citizen's voice is lost. Officers can visually see clustered pins at the exact same location on the GIS Map.
- **Phase 2 Deduplication:** The system applies spatial distance checks (Haversine formula within 50 meters) and semantic text/photo similarity to automatically link incoming reports to a single parent ticket and increment an upvote/report counter (e.g., *"Reported by 10 citizens"*), boosting its urgency.

#### Concurrency Control & ACID Properties (Database Level)
When 10 users click "Submit" at the exact same millisecond, the database handles the concurrent load using **ACID transactions** and atomic operations in Google Cloud Firestore:

1. **Atomicity (All-or-Nothing):**
   - Each submission and cluster update is executed as an atomic unit (using Firestore `runTransaction` or batch operations). If any step fails (e.g., network drops midway), the entire operation rolls back, preventing incomplete or corrupted records.

2. **Consistency (Valid State Guarantee):**
   - The database maintains strict schema invariants. Counters and status states cannot enter negative or contradictory values. Duplicate links always point to valid, existing parent complaint IDs.

3. **Isolation (Concurrency & Race Condition Prevention):**
   - If 10 people increment the report counter at the exact same second, a normal read-modify-write cycle would cause a **race condition (the "Lost Update" problem)**, where several increments overwrite each other and the counter only shows 2 instead of 10.
   - JanMithra avoids this using **Optimistic Concurrency Control (OCC)** with Firestore transactions and **Atomic Field Value Increments (`FieldValue.increment(1)`)**. Each concurrent write is isolated and applied in serial order without locking the database or losing count.

4. **Durability (Permanent Storage):**
   - Once a transaction commits, Firestore immediately replicates the complaint data across multiple distributed data centers. Even in the event of an immediate server crash or client disconnection, the registered complaints and counter updates remain permanently preserved.

---

### 22. How does AI determine which complaint should be resolved first?
The AI evaluates issues against public safety hazard rules:
- **Critical (Top Priority):** Immediate danger to human life (e.g., high-voltage dangling wires, open deep manholes on active roads, contaminated drinking water).
- **High:** Major public disruption or health hazard (e.g., large road potholes causing accidents, burst water mains, raw sewage overflow).
- **Medium:** Standard routine maintenance (e.g., broken streetlights, minor asphalt depressions, overflowing garbage bins).
- **Low:** Minor aesthetic or non-disruptive problems (e.g., faded road paint, minor garden clippings).

---

### 23. What happens if AI produces an incorrect result?
JanMithra is designed with a **"Human-in-the-Loop"** philosophy:
1. **Officer Override:** The municipal officer in the Admin Dashboard has full authority to change the category, adjust urgency, or reassign workers with a single click.
2. **Local Fallback:** If the external AI service encounters a network error or rate limit, a local keyword-based heuristic classifier automatically steps in so the complaint is never dropped.

---

### 24. Can users register complaints in Malayalam?
**Yes.** Modern Vision-Language models like Llama 3.2 are inherently multilingual. They understand Malayalam script (e.g., *"റോഡിൽ വലിയ കുഴി"*) as well as phonetic Manglish (e.g., *"roadil valiya kuzhi"*). Full Malayalam user interface localization (switching buttons and menus to Malayalam) is part of the Phase 2 roadmap.

---

### 25. What is a training dataset? Can the AI system work without one?
A **training dataset** is a massive collection of labeled examples (thousands of pictures of potholes, water leaks, etc.) used to teach an AI model from scratch.

**Can JanMithra work without one? Yes!**
Instead of training our own model from scratch (which costs tens of thousands of dollars and requires massive computing power), JanMithra uses a **pre-trained Foundation Model** (`meta/llama-3.2-11b-vision-instruct` via Gemini). We use **Prompt Engineering** to instruct this pre-trained model on how to categorize civic issues and assess urgency accurately without needing a dedicated custom dataset.

