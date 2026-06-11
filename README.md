# 🚀 Gamified AI/ML Portfolio 

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)
![Redis](https://img.shields.io/badge/Upstash_Redis-FF4438?style=for-the-badge&logo=redis&logoColor=white)

A highly advanced, production-grade personal portfolio built for **Srinivas R C**. This project transcends a traditional resume by integrating an interactive 3D driving experience, real-time recruiter intelligence, a dynamic admin dashboard, and robust edge security.

## ✨ Features

- **🎮 3D Gamified Navigation**: Built with Three.js and React Three Fiber. Users can literally "drive" through the portfolio sections using a custom vehicle interface.
- **🕵️ Recruiter Intelligence Module**: Automatically tracks downloads and engagement. If a user downloads the resume from a top-tier tech company IP (e.g., Google, Amazon, Microsoft), it triggers an instant email alert to the admin.
- **🛡️ Edge Security & Rate Limiting**: Powered by **Upstash Redis**. Global rate limiting (100 req/min) prevents DDoS and scraping attacks. Unauthenticated users are safely tracked via secure `visitorId` cookies.
- **📊 Real-Time Admin Dashboard**: A secure control center to monitor Core Web Vitals, active game sessions, daily views, and download logs. Includes a "Global Kill-Switch" to toggle features instantly.
- **📝 Live Content Editor**: Update portfolio sections, skills, and projects dynamically via the admin panel without redeploying the application.
- **🚀 Ultra-Performant**: Features Redis caching, aggressive Next.js App Router static rendering, and `zod` validated API endpoints.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion
- **3D / Gamification**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Backend**: Node.js, Prisma ORM
- **Database**: PostgreSQL
- **Caching & Edge**: Upstash Redis, `@upstash/ratelimit`
- **Authentication**: NextAuth.js (Auth.js v5)
- **Utilities**: Zod, Nodemailer, Recharts, `ua-parser-js`

## ⚙️ Local Development

### 1. Clone the repository
```bash
git clone https://github.com/srinivas-rc0408/Srinivas-R-C-Portfolio.git
cd Srinivas-R-C-Portfolio
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory. You will need to provide the following keys:

```env
# Auth - REQUIRED for NextAuth.js v5
AUTH_SECRET="your-super-secret-auth-key"
ADMIN_EMAIL="your-email@example.com"

# Database - REQUIRED for Prisma
DATABASE_URL="postgresql://user:password@localhost:5432/portfolio"

# Upstash Redis - REQUIRED for Edge Rate Limiting & Caching
UPSTASH_REDIS_REST_URL="https://your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# SMTP settings for Recruiter Alerts (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```
*(Note: The application is designed to "fail-open". If the database or Redis URL is missing in development, the site will safely bypass those features rather than crashing).*

### 4. Database Setup
Push the schema to your PostgreSQL database:
```bash
npx prisma db push
```

### 5. Start the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

## 🔒 Admin Access
To access the `/admin` dashboard, simply log in using the email address specified in the `ADMIN_EMAIL` environment variable. The system will automatically grant you `ADMIN` privileges upon OAuth or credential authentication.

---
*Architected and developed as a showcase of modern full-stack web development and AI/ML engineering principles.*
