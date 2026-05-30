# Telehealth Pro (wc-telehealth)

Telehealth Pro is a modern, full-stack telemedicine platform designed to connect patients with healthcare providers seamlessly. Built with a focus on accessibility, premium user experience, and robust reliability, the platform offers end-to-end appointment management and secure video consultations.

## 🌟 Core Features

### 🧑‍⚕️ For Doctors (Provider Portal)
- **Automated Schedule Management**: Upon registration, doctors automatically receive a default 30-day schedule (weekdays, 9 AM - 5 PM) which they can further customize.
- **Provider Dashboard**: A comprehensive overview of today's sessions, upcoming appointments, unique patient counts, and total completed consultations.
- **Appointment Management**: View, confirm, reschedule, or cancel patient appointments.
- **Patient EMR Access**: View a patient's full medical history, past records, and previous prescriptions directly from the appointment details modal.
- **Prescription Writing**: Issue new prescriptions to patients following a consultation.
- **Secure Video Consultations**: Join end-to-end encrypted video calls with patients. Sessions include an "End & Complete" workflow to seamlessly wrap up appointments.

### 🤒 For Patients (Patient Portal)
- **Doctor Discovery**: Browse available healthcare professionals, view their specializations, and see their available time slots.
- **Appointment Booking**: Book consultations with preferred doctors based on real-time availability.
- **My Appointments**: A dedicated dashboard to track upcoming and past appointments.
- **Smart "Join Call" Gates**: The video consultation room is securely gated and only becomes accessible 30 minutes before the scheduled start time.
- **Personal Health Records**: Access personal medical history, past consultation records, and active/past prescriptions in one place.

### ⚡ Platform & Technical Features
- **Real-Time Notifications**: Powered by WebSockets (Socket.io), instantly notifying users of appointment updates, cancellations, or completions.
- **Jitsi Meet Integration**: Seamlessly integrated, HIPAA-compliant video conferencing without requiring users to download external apps.
- **Premium UI/UX**: Built with a calming Cyan/Emerald medical-grade color palette, strict accessibility standards (high contrast, focus rings), and smooth micro-animations.
- **Role-Based Access Control (RBAC)**: Secure separation of concerns between Patient and Doctor accounts using JWT authentication.

## 🛠️ Tech Stack

**Frontend (Client)**
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (v4)
- **Typography**: Figtree (Headings) & Noto Sans (Body)
- **Icons**: Lucide React
- **Components**: Shadcn UI (Radix UI primitives)
- **Date Handling**: date-fns
- **API Client**: Axios

**Backend (API)**
- **Framework**: NestJS
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)

---
*Designed and built for modern digital healthcare.*
