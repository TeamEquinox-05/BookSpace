# BookSpace — Setup Guide

> Complete instructions for setting up, configuring, and running BookSpace locally and deploying it to production.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Backend Setup](#3-backend-setup)
4. [Frontend Setup](#4-frontend-setup)
5. [Seed the Admin User](#5-seed-the-admin-user)
6. [Run Locally](#6-run-locally)
7. [Deployment](#7-deployment)
8. [Environment Variable Reference](#8-environment-variable-reference)

---

## 1. Prerequisites

Make sure you have the following installed before starting:

| Tool | Minimum Version | Download |
|------|----------------|----------|
| Node.js | 18.x | https://nodejs.org |
| npm | 9.x (bundled with Node.js) | — |
| Git | 2.x | https://git-scm.com |

You will also need accounts for:

| Service | Purpose | Free tier |
|---------|---------|-----------|
| **MongoDB Atlas** | Cloud database | Yes — M0 cluster |
| **Gmail** (with 2FA) | Email notifications (OTP, booking approvals) | Yes |

---

## 2. Clone the Repository

```bash
git clone <your-repo-url>
cd BookSpace
```

---

## 3. Backend Setup

### 3.1 Install dependencies

```bash
cd backend
npm install
```

### 3.2 Create the config file

```bash
cp src/config/config.env.example src/config/config.env
```

Open `backend/src/config/config.env` and fill in every value (see [Section 8](#8-environment-variable-reference) for details):

```env
MONGO_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/collegeDB"
JWT_SECRET=<generate a strong random secret — see below>
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
NODE_ENV=development
CORS_ORIGINS=
ADMIN_NAME=Super Admin
ADMIN_EMAIL=superadmin@yourdomain.com
ADMIN_PASS=YourSecurePassword123!
ADMIN2_NAME=Admin
ADMIN2_EMAIL=admin@yourdomain.com
ADMIN2_PASS=AnotherSecurePassword123!
```

#### Generating a strong JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as `JWT_SECRET`.

#### Getting a Gmail App Password

1. Enable 2-Factor Authentication on your Google Account.
2. Go to https://myaccount.google.com/apppasswords
3. Generate a new App Password for **Mail**.
4. Copy the 16-character password (with spaces is fine) and use it as `EMAIL_PASS`.

> **Never use your regular Gmail password.** App Passwords are separate credentials that can be revoked independently.

#### Setting up MongoDB Atlas

1. Create a free account at https://cloud.mongodb.com
2. Create a new **M0 (free)** cluster.
3. Under **Database Access**, create a database user with read/write access.
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) or your server IP.
5. Click **Connect → Drivers → Node.js** and copy the connection string.
6. Replace `<password>` in the string with your database user password.
7. If your password contains special characters, URL-encode them (e.g., `@` → `%40`).
8. Paste the full string as `MONGO_URI` in `config.env`.

---

## 4. Frontend Setup

### 4.1 Install dependencies

```bash
cd ../frontend
npm install
```

### 4.2 Environment file (local development)

For local development **no `.env` file is required**. The Vite dev server proxies `/api` and `/uploads` requests to `http://localhost:10000` automatically.

If you want to override this (e.g., connect to a remote backend while running the frontend locally):

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:10000/api   # or your remote backend URL
```

---

## 5. Seed the Admin User

Run the seed script **once** after setting up your database. This creates the two admin accounts defined in `config.env`.

```bash
cd backend
node seed-admin.cjs
```

Expected output:
```
MongoDB Connected...

Seeding Super Admin...
  Created superadmin: Super Admin (superadmin@yourdomain.com)

Seeding Admin...
  Created admin: Admin (admin@yourdomain.com)

Done!
```

Running it again is safe — it skips users that already exist.

---

## 6. Run Locally

Open two terminals.

### Terminal 1 — Backend

```bash
cd backend
node server.cjs
```

The server starts on **http://localhost:10000**.

To verify it is running:

```bash
curl http://localhost:10000/api/health
# Expected: {"status":"healthy","database":"connected",...}
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

The app opens at **http://localhost:5173**.

Log in with the admin email and password you set in `config.env`.

---

## 7. Deployment

### 7.1 Backend — VPS

#### Install Node.js on the server

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

#### Copy the backend to your server

```bash
# On your local machine — push to git, then on the server:
git clone <your-repo-url>
cd BookSpace/backend
npm install
```

#### Create the production config

```bash
cp src/config/config.env.example src/config/config.env
nano src/config/config.env
```

Set these values:

| Key | Value |
|-----|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Your generated secret |
| `EMAIL_USER` | Gmail address |
| `EMAIL_PASS` | Gmail App Password |
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | Your frontend URL (e.g. `https://yourdomain.com`) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASS` | Super admin credentials |
| `ADMIN2_NAME`, `ADMIN2_EMAIL`, `ADMIN2_PASS` | Admin credentials |

#### Seed the admin users

```bash
node seed-admin.cjs
```

#### Run with PM2 (process manager)

Install PM2 to keep the server running and auto-restart on crashes:

```bash
npm install -g pm2
pm2 start server.cjs --name bookspace-backend
pm2 save
pm2 startup   # follow the printed command to enable auto-start on reboot
```

Useful PM2 commands:

```bash
pm2 status                        # check running processes
pm2 logs bookspace-backend        # view live logs
pm2 restart bookspace-backend     # restart the service
pm2 stop bookspace-backend        # stop the service
```

#### Expose the backend via Nginx (reverse proxy)

Install Nginx and create a site config:

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/bookspace-api
```

Paste:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;   # or your server IP

    location / {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://localhost:10000/uploads/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bookspace-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

For HTTPS, use Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### 7.2 Frontend — Build and serve

Build the frontend locally (or on the server) and serve the `dist/` folder:

#### Build

```bash
cd frontend
```

Create a `.env` file with your backend URL:

```bash
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env
```

Build:

```bash
npm run build
# Output is in frontend/dist/
```

> **Important:** `VITE_API_URL` is embedded into the JS bundle at build time. If your backend URL changes, rebuild.

#### Serve with Nginx

Copy `dist/` to your server and add a Nginx site:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/bookspace;   # path where you put dist/
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback
    }
}
```

For HTTPS:

```bash
sudo certbot --nginx -d yourdomain.com
```

#### Update CORS

Once your frontend domain is live, update `CORS_ORIGINS` in `backend/src/config/config.env`:

```env
CORS_ORIGINS=https://yourdomain.com
```

Then restart the backend:

```bash
pm2 restart bookspace-backend
```

---

## 8. Environment Variable Reference

### Backend (`backend/src/config/config.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Random secret for signing JWTs (min 32 chars). Generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `EMAIL_USER` | Yes | Gmail address used to send emails |
| `EMAIL_PASS` | Yes | Gmail App Password (not your regular password) |
| `NODE_ENV` | No | `development` or `production` (default: `development`) |
| `PORT` | No | Server port (default: `10000`) |
| `CORS_ORIGINS` | No | Comma-separated list of allowed frontend URLs for CORS, e.g. `https://yourdomain.com`. Leave empty for local dev |
| `ADMIN_NAME` | Yes* | Display name of the super admin account |
| `ADMIN_EMAIL` | Yes* | Email of the super admin account |
| `ADMIN_PASS` | Yes* | Password for the super admin account |
| `ADMIN2_NAME` | No | Display name of the secondary admin (default: `Admin`) |
| `ADMIN2_EMAIL` | No | Email of the secondary admin (default: `admin@bookspace.com`) |
| `ADMIN2_PASS` | No | Password of the secondary admin (default: `admin123`) |

*Required only when running `seed-admin.cjs`.

### Frontend (`.env` — only needed for production or non-default dev setup)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Prod only | Full URL to the backend API, e.g. `https://api.yourdomain.com/api`. Not needed for local dev (Vite proxy handles it) |

---

## Quick Reference

```
Backend  →  http://localhost:10000
Frontend →  http://localhost:5173
Health   →  http://localhost:10000/api/health
```

Default admin login after seeding:
- Email: value of `ADMIN_EMAIL` in `config.env`
- Password: value of `ADMIN_PASS` in `config.env`
