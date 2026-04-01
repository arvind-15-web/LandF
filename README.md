# 🔍 Lost & Found — Smart City Platform

A full-stack, privacy-first Lost & Found system for smart cities — with intelligent item matching, permission-based contact sharing, secret-code handshakes, and a community star rating system.

---

## 📁 Project Structure

```
lost-and-found/
├── backend/                  # Node.js + Express API
│   ├── server.js
│   ├── config/
│   │   ├── db.js             # MongoDB connection
│   │   ├── firebase.js       # Firebase Admin SDK
│   │   └── cloudinary.js     # Cloudinary + Multer
│   ├── middleware/
│   │   └── auth.js           # Firebase token verification
│   ├── models/
│   │   ├── User.js
│   │   ├── Item.js
│   │   ├── Match.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── items.js
│   │   ├── matches.js
│   │   ├── notifications.js
│   │   └── users.js
│   └── utils/
│       ├── matching.js       # Auto-matching algorithm
│       └── notifications.js  # In-app + FCM push
│
└── frontend/                 # React + Vite + Tailwind
    ├── public/
    │   └── firebase-messaging-sw.js
    └── src/
        ├── api/axios.js      # Axios instance with auth
        ├── context/AuthContext.jsx 
        ├── firebase.js 
        ├── pages/ 
        │   ├── Landing.jsx 
        │   ├── Login.jsx 
        │   ├── Dashboard.jsx 
        │   ├── ReportItem.jsx 
        │   ├── ItemDetail.jsx
        │   ├── Matches.jsx
        │   ├── MatchDetail.jsx
        │   ├── Profile.jsx
        │   └── Notifications.jsx
        └── components/
            ├── Navbar.jsx
            ├── ItemCard.jsx
            ├── MatchCard.jsx
            ├── NotificationBell.jsx
            └── Spinner.jsx
```

---

## ⚙️  Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Firebase project
- Cloudinary account

---

## 🚀 Step-by-Step Setup

### Step 1 — Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### Step 2 — Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Create a project**
2. Enable **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable **Google**
   - Enable **Phone**
3. Get **Web App Config**:
   - Project Settings → General → Your Apps → Add Web App
   - Copy the `firebaseConfig` object values
4. Get **Admin SDK**:
   - Project Settings → Service Accounts → Generate new private key
   - Download the JSON file
5. Enable **Cloud Messaging**:
   - Project Settings → Cloud Messaging → Generate a **Web Push VAPID key**

---

### Step 3 — Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → copy **Cloud name**, **API Key**, **API Secret**

---

### Step 4 — Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/lost-and-found

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

FRONTEND_URL=http://localhost:5173
```

> **Tip**: For `FIREBASE_PRIVATE_KEY`, open the downloaded JSON file and copy the `private_key` value exactly (including the `\n` newlines).

---

### Step 5 — Frontend Environment

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000/api

VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
VITE_FIREBASE_VAPID_KEY=BNtu...
```

---

### Step 6 — Firebase Service Worker

Open `frontend/public/firebase-messaging-sw.js` and replace the placeholder values with your actual Firebase config (same values as `.env` but hardcoded since service workers don't have access to env vars).

---

### Step 7 — Start Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## 🗺 Full User Flow

```
1. Land on homepage → click "Login"
2. Sign in with Google OR Phone OTP
3. Complete profile (name + phone)
4. Dashboard → "Report Lost Item" or "Report Found Item"
5. Fill form (title, description, category, location, date, photos)
   └── Found items get a SECRET CODE (shown once, save it!)
6. Auto-matching runs in background
7. Go to "Matches" → see matched items
8. Click a match → "Request Contact Info"
9. Other party gets notified → Accepts or Rejects
10. If Accepted → both see each other's phone numbers
11. Meet physically → lost owner asks finder for secret code
12. Enter secret code → "Verify & Complete"
13. Rate the finder (1–5 stars)
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register after Firebase login |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/fcm-token` | Update push notification token |

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | List all items (filter by type, category) |
| GET | `/api/items/:id` | Get single item |
| POST | `/api/items` | Report new item (multipart with images) |
| PATCH | `/api/items/:id` | Update item (owner only) |
| DELETE | `/api/items/:id` | Delete item (owner only) |
| GET | `/api/items/my/items` | Get my reported items |

### Matches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | Get my matches |
| GET | `/api/matches/:id` | Get single match |
| POST | `/api/matches/:id/request` | Request contact info |
| POST | `/api/matches/:id/respond` | Accept or reject request |
| POST | `/api/matches/:id/handshake` | Verify secret code |
| POST | `/api/matches/:id/rate` | Rate the finder |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| PATCH | `/api/notifications/:id/read` | Mark one as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/users/profile` | Update profile (name, image) |
| GET | `/api/users/:id` | Get public profile |

---

## 🧠 Matching Algorithm

Items are matched based on a **0–100 confidence score**:

| Criterion | Max Points |
|-----------|-----------|
| Same category | 40 |
| Location keyword overlap | 30 |
| Description keyword overlap | 30 |

A match is created when the score is **≥ 40**. Both users are notified immediately.

---

## ⭐ Star Rating System

| Rating | Stars Added |
|--------|-------------|
| 5/5 | +2 ⭐ |
| 3–4/5 | +1 ⭐ |
| 1–2/5 | 0 ⭐ |

Stars are displayed on every user's profile and item cards.

---

## 🔒 Security Features

- **Firebase Authentication** — Google + Phone OTP, two-factor identity
- **JWT Verification** — Every protected API route verifies Firebase ID tokens
- **Contact Gating** — Phone numbers hidden until both parties approve
- **bcrypt Secret Codes** — Found item codes are hashed with bcrypt (cost 12)
- **Role-based Actions** — Only relevant parties can take each action
- **Input Validation** — All endpoints validate required fields
- **Image Limits** — Max 5 images, 5MB each, images only

---

## 🛠 Production Deployment

### Backend (Railway / Render / Heroku)
1. Set all environment variables in the dashboard
2. Set `NODE_ENV=production`
3. Update `FRONTEND_URL` to your deployed frontend URL

### Frontend (Vercel / Netlify)
1. Set all `VITE_*` environment variables
2. Update `VITE_API_URL` to your backend URL
3. For Netlify: add `_redirects` file: `/* /index.html 200`

### MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Whitelist `0.0.0.0/0` or your server IPs
3. Replace `MONGO_URI` with the Atlas connection string

---

## 🧰 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | Firebase Authentication (Google + Phone OTP) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Image Storage | Cloudinary |
| Security | bcryptjs, Firebase Admin SDK |
| HTTP Client | Axios |

---

## 📝 License

MIT — Built for the community, by the community.
