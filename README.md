# CHEMIApp — Chemist/Pharmacy Management System

A full-stack, cloud-based pharmacy management application with real-time analytics, inventory tracking, POS billing, and role-based access control.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free) for PostgreSQL

### 1. Configure Database
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection String → URI**
3. Copy the connection string
4. Edit `h:\CHEMIApp\.env` and set:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```

### 2. Run Migrations & Seed Data
```powershell
cd h:\CHEMIApp\backend
npx knex migrate:latest --knexfile knexfile.js
npx knex seed:run --knexfile knexfile.js
```

### 3. Start the App
```powershell
# Option A: Use the startup script
h:\CHEMIApp\run_chemiapp.ps1

# Option B: Manually
# Terminal 1 - Backend
cd h:\CHEMIApp\backend
npm run dev

# Terminal 2 - Frontend
cd h:\CHEMIApp\frontend
npm run dev
```

### 4. Open the App
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api/health

---

## 🔑 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@123` |
| Sales Attendant | `cashier1` | `User@123` |

---

## 🏗️ Architecture

```
CHEMIApp/
├── backend/              # Node.js + Express REST API
│   └── src/
│       ├── config/       # DB connection, env config
│       ├── controllers/  # Route handlers
│       ├── middleware/   # Auth, roles, validation
│       ├── migrations/   # PostgreSQL schema
│       ├── routes/       # API endpoints
│       ├── seeds/        # Default data
│       ├── services/     # Business logic
│       └── utils/        # Helpers, constants
└── frontend/             # React 18 + Vite SPA
    └── src/
        ├── api/          # Axios API client
        ├── components/   # Layout + UI components
        ├── context/      # Auth, Theme, Notifications
        └── pages/        # All application pages
```

---

## 🧩 Features

### 🛒 Sales (POS)
- Point-of-Sale interface with item search grid
- Cart management with quantity controls
- Multiple payment methods (Cash, M-Pesa, Card, Insurance)
- Auto receipt generation with receipt number
- Instant stock deduction on sale

### 📦 Inventory
- Full item catalog with category management
- Stock level tracking with reorder alerts
- Expiry date monitoring (color-coded badges)
- Restock with movement history
- Bulk search & filter by category / stock status

### 📊 Analytics (Admin)
- Daily/Weekly/Monthly revenue & profit charts
- Sales trend (Area chart)
- Top selling items (Horizontal bar chart)
- Category breakdown (Pie chart)
- Tabular reports with CSV export

### 👥 User Management (Admin)
- Create sales attendant accounts
- Enable/disable accounts
- Password reset

### 🔐 Security
- JWT authentication (24h tokens + refresh)
- Role-based route protection
- Bcrypt password hashing
- Rate limiting on API
- Helmet security headers

---

## 🌐 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/items` | List items |
| POST | `/api/items` | Add item (Admin) |
| POST | `/api/items/:id/restock` | Restock item |
| GET | `/api/items/alerts/low-stock` | Low stock alerts |
| GET | `/api/items/alerts/expiring` | Expiry alerts |
| POST | `/api/sales` | Create sale |
| GET | `/api/sales` | Sales history |
| GET | `/api/analytics/summary` | Dashboard KPIs |
| GET | `/api/analytics/sales-trend` | Sales chart data |
| GET | `/api/analytics/top-items` | Best sellers |

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Charts | Recharts |
| Styling | Vanilla CSS (custom design system) |
| Backend | Node.js, Express |
| Database | PostgreSQL (Supabase cloud) |
| ORM | Knex.js |
| Auth | JWT + bcrypt |
| Export | CSV (native), PDF-ready |
