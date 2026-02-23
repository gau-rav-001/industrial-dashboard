# 🏭 Industrial Equipment Monitoring Dashboard

**A production-grade full-stack web application for real-time industrial machine monitoring and predictive maintenance — inspired by Atlas Copco SMARTLINK.**

🔗 **Live Demo:** [industrial-dashboard-tau.vercel.app](https://industrial-dashboard-tau.vercel.app)

---

## ✨ Features

- 📊 **Operations Dashboard** — Fleet-wide health summary with live stats, charts, and KPIs
- 🏭 **Machine Registry** — Paginated table of 10,000+ machines with filtering and search
- 🔍 **Machine Detail** — Deep-dive into individual machine sensor readings and history
- ⚡ **Real-Time Prediction** — Enter sensor values and instantly get health score + failure diagnosis
- 🚨 **Anomaly Detection** — Automatically detects 5 failure types (TWF, HDF, PWF, OSF, RNF)
- 💊 **Health Scoring** — Proprietary 0–100 health score algorithm per machine
- 📈 **Trend Visualization** — Chart.js powered health trends, tool wear distribution, status breakdown
- 🔔 **Alert System** — Real-time alerts with severity levels (critical / warning)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Chart.js 4, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Deployment | Vercel (frontend), Render (backend) |
| Dataset | AI4I Predictive Maintenance — Kaggle |
| Fonts | Plus Jakarta Sans, DM Sans, JetBrains Mono |

---

## 📐 Architecture

```
Industrial Monitoring Dashboard
│
├── frontend/                   ← React.js (Presentation Layer)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.js        ← Overview + stats + charts
│       │   ├── MachineList.js      ← Paginated machine table
│       │   ├── MachineDetail.js    ← Single machine deep-dive
│       │   └── RealtimePredict.js  ← Live prediction engine
│       ├── components/
│       │   ├── MachineTable.js     ← Reusable data table
│       │   ├── ChartsPanel.js      ← Chart.js visualizations
│       │   ├── HealthIndicator.js  ← SVG health ring
│       │   └── AlertPanel.js       ← Alert list component
│       ├── services/
│       │   └── api.js              ← Axios API client with retry logic
│       └── App.js                  ← SPA router
│
├── backend/                    ← Node.js + Express (Application Layer)
│   ├── controllers/
│   │   └── machineController.js    ← REST request handlers
│   ├── models/
│   │   └── Machine.js              ← Mongoose schema
│   ├── routes/
│   │   └── machineRoutes.js        ← API route definitions
│   ├── services/
│   │   └── analyticsService.js     ← Health scoring + anomaly detection
│   ├── scripts/
│   │   └── importData.js           ← CSV → MongoDB bulk importer
│   ├── database.js                 ← MongoDB Atlas connection
│   └── server.js                   ← Express entry point + CORS
│
├── dataset/
│   └── predictive_maintenance.csv  ← AI4I dataset (download from Kaggle)
│
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js v20+
- MongoDB Atlas account (free tier)
- npm

### Step 1 — Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/industrial-dashboard.git
cd industrial-dashboard
```

### Step 2 — Get the Dataset
1. Download from: https://www.kaggle.com/datasets/shivamb/machine-predictive-maintenance-classification
2. Place `predictive_maintenance.csv` in the `dataset/` folder

### Step 3 — Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env → paste your MongoDB Atlas connection string as MONGO_URI

npm run import-data   # Import 10,000 records into MongoDB
npm run dev           # Start API server on :5000
```

### Step 4 — Frontend Setup
```bash
cd frontend
npm install
npm start             # Opens at http://localhost:3000
```

---

## 🔌 REST API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/machines` | All machines (paginated, filterable) |
| GET | `/api/machines/:id` | Single machine + full analytics |
| GET | `/api/machines/status/summary` | Fleet health summary |
| GET | `/api/machines/analytics/trends` | Trend data for charts |
| POST | `/api/machines/predict` | Real-time failure prediction |
| GET | `/api/health` | API health check |

### Predict Endpoint — POST `/api/machines/predict`

**Request Body:**
```json
{
  "machineType": "M",
  "airTemperature": 300.5,
  "processTemperature": 310.2,
  "rotationalSpeed": 1500,
  "torque": 40.0,
  "toolWear": 120
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "healthScore": 74,
    "status": "WARNING",
    "failureStatus": false,
    "predictedFailure": "No Failure Predicted",
    "alerts": [],
    "power": 6283,
    "rulEstimate": "~133 min of tool life remaining",
    "tempDifferential": "9.70"
  }
}
```

---

## 📊 Analytics Engine

### Health Score Algorithm (0–100)
Each machine is scored based on:
- **Tool Wear** (40% weight) — primary degradation indicator
- **Temperature Differential** — process vs air (optimal: ~10K)
- **Rotational Speed Deviation** from normal operating range
- **Torque Deviation** from mean
- **Out-of-range Penalties** for critical threshold breaches

### Anomaly Detection — 5 Failure Types
| Code | Name | Trigger |
|------|------|---------|
| TWF | Tool Wear Failure | Tool wear > 200 min |
| HDF | Heat Dissipation Failure | Low temp delta + low speed |
| PWF | Power Failure | Power output out of 3500–9000W range |
| OSF | Overstrain Failure | Tool wear × torque > 11,000 |
| RNF | Random Failure | Stochastic failure |

---

## 🗄️ MongoDB Schema

```js
{
  machineId: String,            // e.g. "M14861"
  machineType: "L" | "M" | "H", // Low / Medium / High quality
  airTemperature: Number,       // Kelvin
  processTemperature: Number,   // Kelvin
  rotationalSpeed: Number,      // RPM
  torque: Number,               // Nm
  toolWear: Number,             // minutes
  failureStatus: Boolean,
  failureType: String,          // "No Failure" | "Tool Wear Failure" | ...
  healthScore: Number,          // 0–100 (calculated)
  timestamp: Date
}
```

---

## 🌐 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | [industrial-dashboard-tau.vercel.app](https://industrial-dashboard-tau.vercel.app) |
| Backend | Render | [industrial-dashboard-api.onrender.com](https://industrial-dashboard-api.onrender.com) |
| Database | MongoDB Atlas | Cloud hosted |

### Environment Variables

**Backend (Render):**
```
MONGO_URI=mongodb+srv://...
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://industrial-dashboard-tau.vercel.app
```

**Frontend (Vercel):**
```
REACT_APP_API_URL=https://industrial-dashboard-api.onrender.com/api
```

---

## 👨‍💻 Developer

**Gaurav Kumbhare**

Built as a full-stack systems project aligned with real-world industrial IoT monitoring platforms like Atlas Copco SMARTLINK.

---

## 📄 Dataset Credit

[AI4I 2020 Predictive Maintenance Dataset](https://www.kaggle.com/datasets/shivamb/machine-predictive-maintenance-classification) — UCI Machine Learning Repository