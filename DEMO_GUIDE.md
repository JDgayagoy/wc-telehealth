# WC Telehealth — Demo Presentation Guide

## Recommended Flow (≈15–20 min)

Run two browser windows side-by-side: one logged in as **Doctor**, one as **Patient**.

---

## 1. Landing Page (1 min)

- Show hero section and value proposition
- Point out role-based entry: **Patient** vs **Doctor** registration

---

## 2. Registration & Onboarding (2 min)

### Patient
1. Register at `/register`
2. On first login → **Onboarding Modal** opens (fill personal info, height/weight)
3. Show BMI auto-calculation

### Doctor
1. Register at `/register/doctor`
2. On first login → **Doctor Onboarding Modal** (specialization, years of experience, bio, license, signature upload)

> **Key point:** Role-based auth — patients and doctors see entirely different dashboards.

---

## 3. Patient: Find a Doctor (3 min)

**Path:** Dashboard → Find a Doctor

1. **Browse all doctors** — show cards with rating, experience, specialization
2. **Filter by specialization** — click a chip (e.g. Cardiologist)
3. **AI Recommendation** — click the Sparkles button, type symptoms (e.g. _"chest pain and shortness of breath"_), hit **Get Recommendation**
   - AI returns matched specializations and filters the doctor list automatically
4. **Book an appointment** — click a doctor → select available slot → confirm booking

> **Highlight:** AI symptom → specialization matching using Gemini.

---

## 4. Patient: Appointments (1 min)

**Path:** Dashboard → Appointments

- Show booked appointment with status (Pending → Confirmed)
- Show **Reschedule** and **Cancel** options
- Show appointment details drawer (doctor info, slot time)

---

## 5. Doctor: Dashboard & Schedule (2 min)

**Path:** Doctor Dashboard

1. Show **overview stats** — total appointments, today's schedule, booking rate chart
2. Go to **Schedule** → add available time slots (date, start/end time, repeat)
3. Show slot management (delete slots)

---

## 6. Doctor: Confirm Appointment (1 min)

**Path:** Doctor → Appointments

- Find the pending appointment booked by patient
- Click **Confirm** → status updates in real time
- Patient sees notification bell update (Socket.IO live notification)

> **Highlight:** Real-time notifications without page refresh.

---

## 7. Video Consultation (4 min)

This is the core feature. Both windows needed.

**Path:** Patient → Appointments → Join | Doctor → Appointments → Start Consultation

1. **Both join** the Jitsi Meet video call embedded in the app
2. On the Doctor side, show the **side panel tabs:**

   | Tab | What to show |
   |-----|-------------|
   | **Patient Records** | Past medical records and diagnoses |
   | **Notes** | Doctor types consultation notes, saves them |
   | **Diagnosis** | Add ICD diagnosis with severity, description |
   | **Prescription** | Add medication, dosage, frequency → Submit |
   | **Lab Requests** | Order lab tests with instructions |

3. Doctor clicks **Complete Consultation** → session ends, appointment marked complete

> **Highlight:** Everything happens inside the call — no switching apps.

---

## 8. Patient: Medical Records (1 min)

**Path:** Patient → Medical Records

Show what was created during the consultation:
- Prescription from the doctor
- Diagnosis entry in the medical history timeline
- Any lab requests ordered

---

## 9. Messaging (1 min)

**Path:** Messages (both roles)

- Show real-time chat between patient and doctor
- Show file/image attachment if available

---

## 10. Profile Management (1 min)

**Path:** Profile (either role)

- Show profile picture upload
- Doctor: show digital signature upload (used on prescriptions)
- Show editable personal information sections

---

## Key Technical Points to Mention

| Feature | Tech |
|---------|------|
| Auth | JWT with role-based guards (Patient / Doctor) |
| Video Call | Jitsi Meet embedded iframe |
| Real-time | Socket.IO (notifications, messages) |
| AI Matching | Google Gemini API |
| File Storage | Cloudinary |
| Database | PostgreSQL via Neon + Prisma ORM |
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | NestJS REST API |
| Hosting | Vercel (frontend) + Render (backend) |

---

## Demo Tips

- **Use seeded/prepared accounts** — don't register live, it wastes time.
- **Pre-book an appointment** before the demo so the video call step is ready to go.
- **Open both windows before presenting** — Render free tier cold-starts (30s delay on first request).
- If Cloudinary uploads fail live, just show the UI flow and explain storage is Cloudinary.
- Lead with the AI recommendation — it's the most impressive single interaction.
