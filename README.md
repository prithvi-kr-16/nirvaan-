# NIRVAAN — Healthcare 2.0

> **Care. Anytime. Anywhere.**  
> A comprehensive, full-stack healthcare resource discovery and patient management platform designed to deliver critical medical access when every second counts.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features & Modules](#-key-features--modules)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Directory Structure](#-directory-structure)
- [Backend REST API](#-backend-rest-api)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Environment Configuration](#-environment-configuration)
- [Confirmed Hospital Dataset (Arwal District, Bihar)](#-confirmed-hospital-dataset-arwal-district-bihar)
- [Author & Credits](#-author--credits)

---

## 🌟 Overview

**NIRVAAN Healthcare 2.0** bridges the critical gap between patients, emergency response teams, and medical facilities. Built with modular HTML5, CSS3, ES6+ JavaScript, and a robust Node.js/Express/MongoDB backend, the platform enables users to:

1. **Monitor live hospital ICU bed availability** and **blood bank stocks** in real time with auto-refreshing tickers and subtle jitter fallbacks.
2. **Find and book verified care providers** (Home Nurses, Physiotherapists, Elder Care specialists, etc.).
3. **Discover accredited district hospitals** with department listings, approximate distances, and appointment booking.
4. **Dispatch emergency ambulances** and access 24/7 hotline direct dialers.
5. **Order prescription and OTC medicines** from an integrated online pharmacy.
6. **Book laboratory diagnostics** and health checkups with home sample collection.
7. **Manage a complete Digital Health Passport**, including personal vitals, family member profiles, medical history logs, and secure PDF medical report uploads with in-browser preview.

---

## 🚀 Key Features & Modules

### 1. 🏥 Live Hospital ICU Beds & Blood Bank Tracker (`find-care.html`, `live-status.html`)
- **Real-Time Polling Engine**: Polls `GET /api/hospitals` and `GET /api/blood-banks` every 15–20 seconds with visual "Last Updated" timestamp updates.
- **Resilient Fallback Mode**: When offline, falls back to a simulated demo dataset with natural jitter (±1 bed / unit per interval) to maintain UI responsiveness.
- **Color-Coded Status Badges**:
  - 🟢 **Available** (>3 beds / >10 units)
  - 🟡 **Warning / Limited** (1–3 beds / ≤5 units)
  - 🔴 **Full / Critical** (0 beds / 0 units)
- **Blood Bank Grid**: Real-time stock counts across all 8 standard blood groups (`A+`, `A-`, `B+`, `B-`, `O+`, `O-`, `AB+`, `AB-`).

### 2. 🏨 Accredited Hospitals Directory (`hospitals.html`, `index.html`)
- Seeded with confirmed real hospital data from **Arwal district, Bihar, India**.
- Search and filter facilities by name, city, ICU availability, or emergency care services.
- Detailed modal popup with department amenities, verified facility badges, contact numbers, and an embedded appointment reservation form.

### 3. 🚑 Emergency & Ambulance Dispatch Hub (`emergency.html`)
- Priority emergency dispatch form capturing patient condition, location, and required ambulance tier.
- Integrated ICU hospital readiness board.
- Direct dial access cards for National Emergency (112 / 911), NIRVAAN Ambulance Dispatch, and Regional Trauma Centers.

### 4. 🤝 Find Care & Home Healthcare Network (`find-care.html`)
- Category-based provider search:
  - 👩‍⚕️ **Home Nurses**
  - 🏃 **Physiotherapy**
  - 👴 **Elder Care**
  - 👶 **Mother & Baby Care**
  - 🩹 **Post Surgery Care**
  - 🧠 **Mental Wellness Support**
  - 🗣️ **Speech Therapy**
  - 🤝 **Patient Care Helpers**
- Interactive booking modal with custom date and time slot scheduling.

### 5. 💊 Online Pharmacy (`pharmacy.html`)
- Categorized medicine catalog (Antibiotics, Pain Relief, Cardiac, Diabetes, Respiratory, Skin Care, First Aid).
- Real-time search by drug name or brand.
- Interactive shopping cart with order summary and direct order submission to `POST /api/orders`.

### 6. 🔬 Diagnostics & Laboratory Tests (`diagnostics.html`)
- Book comprehensive pathology tests (Complete Blood Count, Lipid Profile, Thyroid Profile, Liver Function Test, Diabetes Screen).
- Home collection slot scheduling with date and time selection.

### 7. 📋 Digital Health Passport & Patient Portal (`dashboard.html`)
- **Personal Health Profile**: Blood group, height, weight, BMI calculator, and primary emergency contact.
- **Medical Summary**: Allergies, chronic conditions, and current medications.
- **Family Member Management**: Add and manage individual profiles for dependents and elders.
- **PDF Medical Reports Hub**: Upload diagnostic PDF reports via `multer`, monitor upload progress, and view/download files directly in-app.
- **Medical History Logs**: Timestamped tracking of past diagnoses, treatments, attending hospitals, and recovery status.

### 8. 🔐 Authentication & Session Engine (`login.html`, `signup.html`, `auth.js`)
- Mobile number OTP verification simulation.
- Session persistence via `sessionStorage` with automatic dynamic navbar updates across all pages.
- Global active route indicator (`highlightActiveNav`) ensuring consistent underline highlighting on both desktop and mobile navigation menus.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3 (CSS Grid, Flexbox, Custom Properties), Vanilla JavaScript (ES6+) |
| **Icons & Design** | Lucide-inspired SVG icon system, Outfit typography, responsive mobile drawers |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas with Mongoose ODM (includes local JSON database fallbacks) |
| **File Storage** | Multer for secure PDF medical report uploads |
| **Environment** | Dotenv, CORS enabled for decoupled hosting |

---

## 📁 Directory Structure

```text
Healthcare 2.0/
├── README.md                      # Project documentation (this file)
├── backend/
│   ├── .env                       # Backend environment variables
│   ├── package.json               # Backend dependencies & npm scripts
│   ├── server.js                  # Express REST API, MongoDB schemas & routes
│   ├── data/                      # Local JSON fallback databases
│   │   ├── appointments.json      # Appointment records
│   │   ├── diagnostics.json       # Diagnostic test bookings
│   │   ├── dispatches.json        # Ambulance dispatches
│   │   ├── hospitals.json         # Arwal district hospital records
│   │   ├── medicines.json         # Pharmacy medicine inventory
│   │   ├── orders.json            # Pharmacy orders
│   │   ├── tests.json             # Diagnostic test catalogue
│   │   └── users.json             # User accounts & health profiles
│   ├── scripts/                   # Database maintenance & seed utilities
│   └── uploads/                   # Stored PDF medical reports
└── frontend/
    ├── index.html                 # Homepage with hero, search & services
    ├── find-care.html             # Live ICU / Blood Bank status & care providers
    ├── live-status.html           # Dedicated live monitoring dashboard
    ├── hospitals.html             # Hospitals directory & appointment booking
    ├── emergency.html             # Ambulance dispatch & emergency response
    ├── pharmacy.html              # Online medicine store & cart
    ├── diagnostics.html           # Lab tests & health packages
    ├── dashboard.html             # Patient Health Passport & medical records
    ├── login.html                 # User authentication (Login)
    ├── signup.html                # User registration (Sign Up)
    ├── favicon.svg                # Brand icon
    ├── auth.js                    # Session handling, OTP flow & nav highlighter
    ├── script.js                  # Homepage search, modal & dispatcher logic
    ├── find-care.js               # Polling engine, jitter logic & provider booking
    ├── CSS/
    │   ├── style.css              # Main stylesheet bundle importer
    │   ├── global.css             # Typography, reset, navbar, badges & buttons
    │   ├── home.css               # Hero section, search card & service grid
    │   ├── find-care.css          # Live ICU bed and blood bank board styles
    │   ├── modals.css             # Modal overlays and popups
    │   ├── services.css           # Service card layouts
    │   ├── auth.css               # Login & signup forms
    │   └── responsive.css         # Mobile navigation and viewport breakpoints
    └── images/
        ├── 2pmch.jpeg
        ├── hero_background.jpg     # Hero background image
        ├── avatars/               # Patient avatar imagery
        └── hospitals/             # Facility photos (city_care, sunrise, hope, life_care)
```

---

## 📡 Backend REST API

The backend runs by default at `http://localhost:3000`.

### Authentication & Users
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new patient account |
| `POST` | `/api/auth/login` | Authenticate user credentials |
| `GET` | `/api/auth/user/:email` | Retrieve user account and health profile |
| `PUT` | `/api/user/health-profile` | Update personal health metrics and vitals |

### Family Members & Medical Reports
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/user/family` | Add a dependent family member |
| `DELETE` | `/api/user/family/:id` | Delete a family member and their records |
| `POST` | `/api/user/family/:id/reports` | Upload a PDF medical report (`multipart/form-data`) |
| `GET` | `/api/user/reports/:filename` | Stream/download an uploaded PDF report |
| `DELETE` | `/api/user/family/:id/reports/:reportId` | Remove a PDF medical report |
| `POST` | `/api/user/family/:id/medical-history` | Log a past disease, surgery, or treatment |
| `DELETE` | `/api/user/family/:id/medical-history/:recordId` | Delete a medical history entry |

### Hospitals & Blood Banks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/hospitals` | Fetch hospitals (supports `?city=` and `?search=` filters, with fallback to `hospitals.json`) |
| `GET` | `/api/blood-banks` | Get real-time stock counts across 8 blood groups |
| `POST` | `/api/appointments` | Book a hospital appointment |

### Emergency, Pharmacy & Diagnostics
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/emergency/dispatch` | Submit an urgent ambulance dispatch request |
| `GET` | `/api/medicines` | Query pharmacy catalog (`?search=` & `?category=`) |
| `POST` | `/api/orders` | Place a medicine purchase order |
| `GET` | `/api/diagnostics/tests` | Query available laboratory checkup tests |
| `POST` | `/api/diagnostics/book` | Schedule a diagnostic test appointment |

---

## 💻 Getting Started

### Prerequisites
- **Node.js** (v16.x or higher)
- **npm** (v8.x or higher)
- **MongoDB Atlas** account or a local MongoDB instance running on `mongodb://localhost:27017`
- A modern web browser (Chrome, Firefox, Edge, Safari)

---

### 1. Backend Setup

1. Open your terminal and navigate to the `backend` directory:
   ```bash
   cd "backend"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your `.env` file in `backend/.env`:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/nirvaan?retryWrites=true&w=majority
   DB_NAME=nirvaan
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   You should see:
   ```text
   🚀 Server running on port 3000
   ✅ Connected to MongoDB Atlas (nirvaan)
   ```

---

### 2. Frontend Setup

The frontend consists of static web assets and does not require a compilation step.

#### Option A: Using VS Code Live Server (Recommended)
1. Open the project folder in VS Code.
2. Right-click on `frontend/index.html`.
3. Select **"Open with Live Server"**.
4. The application will launch at `http://127.0.0.1:5500/frontend/index.html`.

#### Option B: Using any static HTTP server (e.g., Python or Node)
```bash
# From the project root:
npx serve frontend -p 5500
# OR with Python:
python -m http.server 5500 --directory frontend
```
Navigate to `http://localhost:5500` in your browser.

---

## ⚙️ Environment Configuration

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `3000` | Port on which Express API listens |
| `MONGODB_URI` | Yes | — | MongoDB Atlas or local connection string |
| `DB_NAME` | No | `nirvaan` | Database name for Mongoose models |

> [!NOTE]
> If MongoDB is offline or inaccessible during local evaluation, the backend gracefully falls back to the static datasets located in `backend/data/` so that core features like Hospital Search and Blood Bank querying continue to operate seamlessly.

---

## 📍 Confirmed Hospital Dataset (Arwal District, Bihar)

The platform is seeded with real confirmed medical institutions located in **Arwal district, Bihar, India**:

| # | Facility Name | Ownership | Status | Distance | Address | Phone |
|---|---|---|---|---|---|---|
| 1 | **Arwal Sadar Hospital** | Government | Verified ✅ | `~1.5 km (approx.)` | Opposite DM Residence, Arwal, Bihar 804401 | 9470003045 |
| 2 | **Government Hospital, Arwal** | Government | Verified ✅ | `~3.0 km (approx.)` | Arwal, Bihar 804419 | — |
| 3 | **Satyadev Multi Super Speciality Hospital** | Private | Clinical | `4.2 km` | Sipah Panchayat, Arwal, Bihar | — |
| 4 | **Khursheed Ahmad Memorial Hospital** | Private | Clinical | `2.8 km` | Arwal, Bihar 804401 | — |
| 5 | **Pipra Hospital Pvt. Ltd** | Private | Clinical | `5.5 km` | Arwal, Bihar 804401 | — |
| 6 | **Primary Health Centre, Arwal** | Government | Verified ✅ | `~4.5 km (approx.)` | Arwal, Bihar 804427 | — |

*ICU bed capacities and ratings are demo values and can be mapped to official hospital IoT telemetry systems in production.*

---

## 👨‍💻 Author & Credits

- **Project**: NIRVAAN Healthcare 2.0
- **Tagline**: Care. Anytime. Anywhere.
- **Repository**: `prithvi-kr-16/nirvaan-`

