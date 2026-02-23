# 🏭 Industrial Equipment Monitoring Dashboard
### Aligned with Atlas Copco SMARTLINK Architecture

A full-stack industrial monitoring system built with React, Node.js/Express, and MongoDB — powered by the **AI4I Predictive Maintenance Dataset**.

---

## 📐 Architecture

```
Industrial Monitoring Dashboard
│
├── frontend/               ← React.js (Presentation Layer)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.js        ← Overview + stats + charts
│       │   ├── MachineList.js      ← Paginated machine table
│       │   └── MachineDetail.js    ← Single machine deep-dive
│       ├── components/
│       │   ├── MachineTable.js     ← Reusable data table
│       │   ├── ChartsPanel.js      ← Chart.js visualizations
│       │   ├── HealthIndicator.js  ← SVG health ring
│       │   └── AlertPanel.js       ← Alert list component
│       ├── services/
│       │   └── api.js              ← Axios API client
│       └── App.js                  ← SPA router
│
├── backend/                ← Node.js + Express (Application Layer)
│   ├── controllers/
│   │   └── machineController.js    ← Request handlers
│   ├── models/
│   │   └── Machine.js              ← Mongoose schema
│   ├── routes/
│   │   └── machineRoutes.js        ← REST route definitions
│   ├── services/
│   │   └── analyticsService.js     ← Health scoring + anomaly detection
│   ├── scripts/
│   │   └── importData.js           ← CSV → MongoDB importer
│   ├── database.js                 ← MongoDB connection
│   └── server.js                   ← Express entry point
│
├── dataset/
│   └── predictive_maintenance.csv  ← AI4I dataset (you add this)
│
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

---

### Step 1 — Get the Dataset

1. Go to: https://www.kaggle.com/datasets/shivamb/machine-predictive-maintenance-classification
2. Download `predictive_maintenance.csv`
3. Place it in the `dataset/` folder at the project root

---

### Step 2 — Backend Setup

```bash
cd backend
npm install

# Create your environment file
cp .env.example .env
# Edit .env → set MONGO_URI to your MongoDB connection string

# Import the dataset into MongoDB
npm run import-data

# Start the API server
npm run dev
```

The backend will run at **http://localhost:5000**

---

### Step 3 — Frontend Setup

```bash
cd frontend
npm install

# Start the React dev server
npm start
```

The dashboard will open at **http://localhost:3000**

---

## 🔌 REST API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/machines` | All machines (paginated, filterable) |
| GET | `/api/machines/:id` | Single machine + analytics |
| GET | `/api/machines/status/summary` | Fleet health summary |
| GET | `/api/machines/analytics/trends` | Trend data for charts |
| GET | `/api/health` | API health check |

### Query Parameters for `GET /api/machines`
| Param | Values | Description |
|-------|--------|-------------|
| `status` | `operational`, `failed` | Filter by failure status |
| `type` | `L`, `M`, `H` | Filter by machine type |
| `limit` | number | Records per page (default: 100) |
| `page` | number | Page number |
| `sort` | field name | Sort field (prefix `-` for desc) |

---

## 📊 Analytics Features

### Health Score Calculation
Each machine gets a score (0–100) based on:
- **Tool wear** (40% weight) — primary degradation indicator
- **Temperature differential** — process vs air temp
- **Rotational speed deviation** from normal range
- **Torque deviation** from mean
- **Out-of-range penalties** for critical values

### Anomaly Detection
The system detects 5 failure types from the AI4I dataset:
- **TWF** — Tool Wear Failure (wear > 200 min)
- **HDF** — Heat Dissipation Failure (temp + speed combo)
- **PWF** — Power Failure (torque × speed out of range)
- **OSF** — Overstrain Failure (high torque + worn tool)
- **RNF** — Random Failure

---

## 🗄️ MongoDB Schema

```js
{
  machineId: String,          // e.g. "M14861"
  machineType: "L" | "M" | "H",
  airTemperature: Number,     // Kelvin
  processTemperature: Number, // Kelvin
  rotationalSpeed: Number,    // RPM
  torque: Number,             // Nm
  toolWear: Number,           // minutes
  failureStatus: Boolean,
  failureType: String,        // "No Failure" | "Tool Wear Failure" | ...
  healthScore: Number,        // 0–100
  timestamp: Date
}
```

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18, Chart.js 4, react-chartjs-2 |
| Fonts | Rajdhani, Share Tech Mono, Exo 2 |
| API | Node.js, Express.js |
| DB | MongoDB, Mongoose |
| Dataset | AI4I Predictive Maintenance (Kaggle) |

---

## 📁 Dataset Note

The `dataset/` folder must contain `predictive_maintenance.csv` downloaded from Kaggle.
The import script handles both naming conventions found in the dataset.
