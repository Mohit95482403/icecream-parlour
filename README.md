# 🍦 GLACÉ — Premium Artisanal Ice Cream Platform

A full-stack production-ready e-commerce platform for premium ice cream, featuring customer storefront, admin dashboard, gift cards, gift orders, delivery management, and more.

## 📁 Project Structure

```
icecream-platform/
├── frontend/          # React + Vite frontend (deployed to Vercel)
├── backend/           # Node.js + Express API (deployed to Render)
├── database/          # SQL schema and migrations
├── tests/             # End-to-end test suites
├── .github/workflows/ # CI/CD pipeline
├── render.yaml        # Render deployment blueprint
├── vercel.json        # Vercel deployment configuration
└── README.md
```

## 🚀 Local Development

### Prerequisites
- Node.js >= 18
- MySQL (XAMPP / phpMyAdmin for local development)

### 1. Database Setup
```bash
# Import the schema into your local MySQL
mysql -u root < database/production_schema.sql
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env    # Edit with your local DB credentials
npm start               # Starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env    # Set VITE_API_URL=http://localhost:5000/api
npm run dev             # Starts on http://localhost:5173
```

## 🌐 Production Deployment

### Deployment Order
1. **Database** — Create a cloud MySQL instance (Aiven, Railway, PlanetScale, etc.)
2. **Backend → Render** — Connect GitHub repo, set root directory to `backend`
3. **Frontend → Vercel** — Connect GitHub repo, set root directory to `frontend`
4. Set `VITE_API_URL` in Vercel to your Render backend URL
5. Set `FRONTEND_URL` and `CLIENT_URL` in Render to your Vercel frontend URL
6. Run `npm run db:migrate` on the backend to initialize the production database

### Render (Backend)
| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check | `/api/health` |

### Vercel (Frontend)
| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

## 🔐 Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

### Backend (`backend/.env`)
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<strong_random_secret>
FRONTEND_URL=https://your-frontend.vercel.app
CLIENT_URL=https://your-frontend.vercel.app
DB_HOST=<cloud_mysql_host>
DB_PORT=3306
DB_USER=<db_user>
DB_PASSWORD=<db_password>
DB_NAME=<db_name>
DB_SSL=true
```

## ✨ Features
- Customer authentication & authorization
- Admin dashboard with role-based access
- Product catalog with variants, categories, and collections
- Shopping cart and checkout
- Self-created payment system (no external gateway)
- Order lifecycle management
- Delivery zone management and tracking
- Cancellation and refund processing
- Gift card system with ledger
- Gift order support
- Buy Again functionality
- Coupon system
- Wishlist
- Product reviews
- Invoice generation (PDF)
- Real-time notifications

## 🧪 Testing
```bash
cd tests
node test-full-production-suite.js     # Complete E2E suite
node test-gift-order-e2e.js            # Gift order tests
node test-gift-cards-e2e.js            # Gift card tests
```

## 📄 License
ISC
