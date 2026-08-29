# Premium Ice Cream Parlour Platform

This project is the foundational architecture for a premium ice cream brand ecommerce platform.

## Architecture

The project is built using:
- **Frontend**: React, React Router, Tailwind CSS, Axios, Framer Motion
- **Backend**: Node.js, Express.js
- **Database**: MySQL (via XAMPP)

## Folder Structure

```text
icecream-platform/
├── client/          # React frontend
├── server/          # Express backend API
├── database/        # MySQL schemas and seed data
├── .gitignore
├── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js installed
- XAMPP installed (for Apache and MySQL)

### 1. Database Setup (XAMPP)

1. Open **XAMPP Control Panel** and start **Apache** and **MySQL**.
2. Open your browser and go to `http://localhost/phpmyadmin`.
3. Create a new database named `icecream_db`.
4. Import the schema:
   - Click on `icecream_db`.
   - Go to the **Import** tab.
   - Choose `database/schema.sql` and click **Import**.
5. Import the seed data:
   - Go to the **Import** tab again.
   - Choose `database/seed.sql` and click **Import**.

### 2. Backend Setup

1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update values if necessary:
   ```bash
   cp .env.example .env
   ```
4. Start the server:
   ```bash
   node server.js
   # Or npm run dev if nodemon is configured
   ```
5. The API will run on `http://localhost:5000`. You can check `http://localhost:5000/api/health`.

### 3. Frontend Setup

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the application in your browser at `http://localhost:5173`.

## Authentication (Day 1 Seed)
An initial admin account has been created:
- Email: `admin@icecream.local`
- Password: `password123`

## Design System Tokens
The brand uses a refined, modern aesthetic:
- **Colors**: Ivory (`#F8F5EF`), Espresso (`#211B17`), Warm Taupe (`#B8AA9A`), Pistachio (`#A8B58A`), Berry (`#9A5261`)
- **Typography**: Playfair Display (Serif / Display), Inter (Sans-serif / UI)
- **Rounding**: Small (6px), Medium (10px), Large (16px), Pill (9999px)
