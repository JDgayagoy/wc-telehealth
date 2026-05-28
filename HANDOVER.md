# wc-telehealth - Project Handover

## 📌 Project Overview
`wc-telehealth` is a full-stack web application designed for telehealth services, featuring separate portals for patients and doctors. The project is structured as a monorepo containing a frontend web application and a backend API.

## 🛠 Tech Stack
**Frontend (`/frontend`)**
*   **Framework:** Next.js (v16.2.6) with React 19
*   **Styling:** Tailwind CSS (v4), shadcn/ui components, Phosphor Icons / Lucide React
*   **Forms & Validation:** React Hook Form, Zod
*   **State & Data:** Axios, Socket.io-client

**Backend API (`/api`)**
*   **Framework:** NestJS (v11)
*   **Database ORM:** Prisma (v7.8.0)
*   **Database Engine:** PostgreSQL
*   **Authentication:** Passport, JWT, bcrypt

## 🔄 Recent Progress & Current State

1.  **Database Architecture:**
    *   Prisma schema has been configured with `User`, `Profile`, `PhysicalStat`, `MedicalHistory`, and `DoctorProfile` models.
    *   Role-based architecture is established using the `Role` enum (`PATIENT`, `DOCTOR`).

2.  **Authentication System:**
    *   `AuthController` (`api/src/auth/auth.controller.ts`) is set up with `/auth/register` and `/auth/login` endpoints.
    *   Data Transfer Objects (DTOs) for Login and Registration have been defined.
    *   (Note: Ensure JWT strategies and guards are fully wired up in the NestJS modules).

3.  **Frontend Layouts & Dashboards:**
    *   Basic scaffolding for the Doctor Dashboard is in place (`frontend/app/dashboard/doctor/page.tsx`).
    *   Registration/Login UI flows have been worked on recently (as per git history).

## 🚀 Running the Project locally

Both servers need to run concurrently during development.

**1. Database**
Ensure your local PostgreSQL database is running and the `.env` file in the `/api` directory has the correct `DATABASE_URL`.

**2. Backend API**
```bash
cd api
npm install
npx prisma generate
npx prisma db push # or npx prisma migrate dev
npm run start:dev
```
*API runs on port 3000 (default NestJS).*

**3. Frontend**
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on port 3000/3001 (default Next.js depending on availability).*

## 🚧 Next Steps / Open Tasks

*   **Frontend-Backend Integration:** Connect the React Hook Form-based login and registration pages to the NestJS API endpoints using Axios.
*   **Protected Routes:** Implement JWT validation on the frontend to protect the `/dashboard` routes, redirecting unauthenticated users to `/login`.
*   **Dashboard Development:** Expand the Doctor Dashboard (`/dashboard/doctor`) and Patient Dashboard to fetch and display data from the respective Prisma models.
*   **Prisma Client:** Ensure any recent Prisma upgrade configuration errors (e.g., removing the `url` from PrismaClient constructor in favor of env vars) are fully resolved across all services.
