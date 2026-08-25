# FocusSync — Smart Classroom Mobile Usage Controller 📱🔒

[![Version](https://img.shields.io/badge/version-1.2.19-blue.svg)](package.json)
[![React Native](https://img.shields.io/badge/React%20Native-0.86.0-61dafb.svg)](https://reactnative.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](backend/package.json)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-brightgreen.svg)](https://www.mongodb.com)

**FocusSync** is an enterprise-grade Smart Classroom Mobile Usage Control platform designed to regulate mobile device usage during active class hours. It provides real-time policy enforcement, automated schedule synchronization, and interactive management dashboards for Students, Staff, and Administrators.

---

## 🌟 Key Features

### 🎓 Student Dashboard
- **Real-time App Restriction**: Enforces fail-closed blocking during designated class hours.
- **Sync Status Monitor**: Dynamic indicator reflecting WebSocket connection status and active blocking policies.
- **Notifications Hub**: Receive real-time FCM alerts and schedule updates.
- **Permission Gate**: Guided modal workflow for required Android device administrator and accessibility permissions.

### 👨‍🏫 Staff Dashboard
- **Classroom Controller**: Instantly lock/unlock student devices or trigger emergency session overrides.
- **Schedule Management**: Create, update, and view class-specific mobile usage policies.
- **Live Student Monitoring**: Real-time visibility into student connection and compliance status.

### 🛠️ Admin Dashboard
- **System Administration**: Full management of users (Students, Staff), classes, and device groups.
- **Audit & Analytics**: Export detailed Excel (`.xlsx`) and PDF report summaries for attendance and policy adherence.
- **Automated Cron Jobs**: Background scheduling engine enforcing automatic lock/unlock transitions.

---

## 🏗️ Architecture & Tech Stack

```
moblie_controler/
├── frontend/                  # React Native Mobile App
│   ├── admin_dashboard/       # Admin control panels & audit components
│   ├── staff_dashboard/       # Staff session management & controls
│   ├── student_dashboard/     # Student app restriction & status monitors
│   ├── components/            # Shared UI components (Modals, Buttons)
│   ├── services/              # API HTTP clients & WebSocket handlers
│   └── utils/                 # Storage, state, & helper utilities
├── backend/                   # Node.js / Express Server API
│   ├── config/                # Database & Firebase configuration
│   ├── middleware/            # JWT Auth, validation & security headers
│   ├── models/                # MongoDB Mongoose schemas
│   ├── routes/                # REST API endpoints (Admin, Staff, Student)
│   ├── services/              # Business logic (FCM, PDF/Excel generation)
│   ├── sockets/               # Real-time Socket.IO event handlers
│   └── server.js              # Server bootstrapper & cron setup
└── README.md                  # Project documentation
```

### Stack Components
- **Frontend**: React Native `0.86.0`, Async Storage, Vector Icons, Socket.IO Client.
- **Backend**: Node.js (`>= 22.11.0`), Express `4.21`, MongoDB / Mongoose `8.6`, Socket.IO `4.8`, Firebase Admin SDK.
- **Security & Utilities**: JWT Authentication, bcrypt, Helmet, Express Rate Limit, Pino logger, Nodemailer, PDFKit, XLSX.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v22.11.0` or higher
- **Package Manager**: `npm` or `yarn`
- **Android SDK & JDK**: Installed & configured for React Native development
- **Database**: Active MongoDB instance (Local or MongoDB Atlas)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables (create .env from template)
cp .env.example .env   # Adjust MONGO_URI, JWT_SECRET, PORT as needed

# Seed initial database data (optional)
npm run seed

# Start development backend server
npm run dev
```

The backend server runs on `http://localhost:5000` by default.

---

### 2. Frontend (Mobile App) Setup

```bash
# From project root directory
npm install

# Start Metro Bundler
npm start

# In a new terminal window, run on Android emulator or connected device
npm run android
```

#### Handy Terminal Scripts
| Command | Description |
| :--- | :--- |
| `npm start` | Starts Metro bundler on port 8081 with cache reset |
| `npm run android` | Builds and runs app on default connected Android device |
| `npm run android:emulator` | Runs app on designated emulator instance (`Pixel_10_Pro_XL`) |
| `npm run start:fresh` | Kills active process on port 8081 and starts Metro clean |

---

## 📦 Release Artifacts & Builds

Pre-built Android APK releases are tracked in the repository root for testing and deployment:

| Release Version | File Name | Notes |
| :--- | :--- | :--- |
| **v1.2.19** (Latest) | [`FocusSync-v1.2.19.apk`](FocusSync-v1.2.19.apk) | Latest stable release with backend sync fixes |
| **v1.2.18** | [`FocusSync-v1.2.18.apk`](FocusSync-v1.2.18.apk) | Admin & Staff notification enhancements |
| **v1.2.17** | [`FocusSync-v1.2.17.apk`](FocusSync-v1.2.17.apk) | Schedule gate & start-time lock fixes |
| **v1.2.16** | [`FocusSync-v1.2.16.apk`](FocusSync-v1.2.16.apk) | Fail-closed blocking engine implementation |
| **v1.2.8** | [`FocusSync-v1.2.8.apk`](FocusSync-v1.2.8.apk) | Initial release build |

---

## 🤝 Contribution & Maintenance Guidelines

To maintain code quality and clean project history across contributions:

### 1. Branching Strategy
- **`main`**: Production-ready code.
- **`dharani`**: Main development & staging branch.
- **Feature Branches**: `feature/<feature-name>` (e.g. `feature/student-analytics`).
- **Bug Fix Branches**: `fix/<issue-name>` (e.g. `fix/socket-reconnect-gate`).

### 2. Conventional Commit Messages
Format commit messages clearly:
- `feat:` New features or capabilities
- `fix:` Bug fixes or corrections
- `docs:` Documentation improvements
- `refactor:` Code improvements without functionality changes
- `build:` Release builds and dependency updates

### 3. Pre-Commit Checklist
Before pushing changes:
1. Run linter: `npm run lint`
2. Test backend API: `cd backend && npm test`
3. Verify clean environment (ensure `.env` files with secret credentials are never committed).
4. Pull remote changes: `git pull --rebase origin dharani`

---

## 📄 License

This project is proprietary and maintained for Smart Classroom Mobile Usage Control.
