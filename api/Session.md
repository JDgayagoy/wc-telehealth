# Medical Records Access Feature — Master Prompt

## Feature Name

Medical Records Access

---

# Feature Overview

This feature enables doctors to access a patient’s medical consultation history, previously issued prescriptions, and medical records directly from the appointments module.

Doctors will be able to:

* View a list of appointments
* Select an appointment
* Open a modal containing:

  * Patient details
  * Consultation history
  * Previously issued prescriptions
  * Medical records
  * Previous diagnoses
  * Notes from earlier consultations

This feature improves continuity of care and allows doctors to make informed medical decisions during consultations.

---

# Core User Flow

## Doctor Workflow

1. Doctor logs into the dashboard
2. Doctor navigates to:

   * Appointments
3. System displays:

   * Upcoming appointments
   * Completed appointments
4. Doctor clicks an appointment
5. A modal opens
6. Modal displays:

   * Patient information
   * Consultation history
   * Prescriptions
   * Medical records
   * Previous diagnoses
   * Notes

---

# Main Components

## Frontend Components

### Appointment List

Displays all appointments assigned to the doctor.

Possible fields:

* Appointment ID
* Patient Name
* Date
* Time
* Status

### Appointment Card/Table Row

Clickable item that opens the patient history modal.

### Patient History Modal

Main modal component containing:

#### Sections

* Patient Profile
* Consultation History
* Prescriptions
* Medical Records
* Notes

### Prescription History Component

Displays previously issued prescriptions.

### Medical Records Timeline

Chronological display of:

* Diagnoses
* Treatments
* Consultation summaries

---

# Backend Requirements

## Required APIs

### Get Doctor Appointments

GET /appointments/doctor/:doctorId

Returns:

* List of appointments for the authenticated doctor

---

### Get Appointment Details

GET /appointments/:appointmentId

Returns:

* Appointment information
* Patient information

---

### Get Patient Medical History

GET /patients/:patientId/history

Returns:

* Consultation history
* Diagnoses
* Notes
* Medical records

---

### Get Patient Prescriptions

GET /patients/:patientId/prescriptions

Returns:

* List of prescriptions
* Medication details
* Dates issued

---

# Suggested Database Structure

## Appointment

```ts
model Appointment {
  id          String   @id @default(uuid())
  doctorId    String
  patientId   String
  date        DateTime
  status      String
  notes       String?
  createdAt   DateTime @default(now())

  doctor       User @relation(fields: [doctorId], references: [id])
  patient      User @relation(fields: [patientId], references: [id])
}
```

---

## MedicalRecord

```ts
model MedicalRecord {
  id             String   @id @default(uuid())
  patientId      String
  doctorId       String
  diagnosis      String
  treatment      String?
  consultationNotes String?
  createdAt      DateTime @default(now())

  patient User @relation(fields: [patientId], references: [id])
  doctor  User @relation(fields: [doctorId], references: [id])
}
```

---

## Prescription

```ts
model Prescription {
  id            String   @id @default(uuid())
  patientId     String
  doctorId      String
  medication    String
  dosage        String
  instructions  String
  createdAt     DateTime @default(now())

  patient User @relation(fields: [patientId], references: [id])
  doctor  User @relation(fields: [doctorId], references: [id])
}
```

---

# Suggested Modal Layout

## Header

* Patient Name
* Age
* Gender
* Appointment Date

---

## Tabs

### 1. Consultation History

Displays:

* Previous consultations
* Diagnoses
* Notes

### 2. Prescriptions

Displays:

* Medication name
* Dosage
* Instructions
* Date prescribed

### 3. Medical Records

Displays:

* Treatments
* Findings
* Uploaded documents

---

# Suggested Tech Stack Implementation

## Frontend

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Query or SWR

## Backend

* NestJS
* PostgreSQL
* Prisma ORM
* JWT Authentication

---

# Suggested Frontend State

```ts
const [selectedAppointment, setSelectedAppointment] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [patientHistory, setPatientHistory] = useState([]);
const [prescriptions, setPrescriptions] = useState([]);
```

---

# Suggested Backend Architecture

## Modules

### Appointments Module

Handles:

* Fetching doctor appointments
* Appointment details

### Patients Module

Handles:

* Patient information
* Medical history

### Prescriptions Module

Handles:

* Prescription records

### Medical Records Module

Handles:

* Diagnoses
* Consultation records
* Treatments

---

# Security Requirements

Because this is healthcare-related data:

## Required Security Measures

* JWT Authentication
* Role-based authorization
* Doctor can only access assigned patients
* Audit logs for record access
* Encrypted sensitive data
* HTTPS only

---

# Suggested UI/UX Features

## Nice-to-Have Features

### Search Patient History

Allow doctors to search:

* Diagnoses
* Medications
* Consultation notes

### Filter by Date

Filter:

* Recent consultations
* Prescriptions
* Records

### Timeline View

Display patient history chronologically.

### Download Prescription

Export prescription as PDF.

---

# Example User Story

## User Story

As a doctor,
I want to access a patient’s consultation history and prescriptions from the appointment list,
so that I can review previous medical information before conducting a consultation.

---

# Acceptance Criteria

## Functional Requirements

* Doctor can view appointment list
* Doctor can click an appointment
* Modal opens successfully
* Patient history loads correctly
* Prescriptions load correctly
* Medical records display correctly
* Unauthorized users cannot access records

---

# Suggested Folder Structure

```bash
frontend/
├── components/
│   ├── appointments/
│   ├── medical-records/
│   ├── prescriptions/
│   └── modals/

backend/
├── src/
│   ├── appointments/
│   ├── medical-records/
│   ├── prescriptions/
│   ├── patients/
│   └── auth/
```

---

# Future Enhancements

* AI-generated consultation summaries
* Voice-to-text consultation notes
* File upload for lab results
* E-prescription generation
* Real-time consultation updates
* Notifications for follow-ups

---

# Development Priority

## MVP Version

Focus first on:

1. Appointment list
2. Click appointment
3. Open modal
4. Display patient history
5. Display prescriptions

Everything else can be added later.

---

# Final Goal

Build a secure and scalable medical records access system that allows doctors to efficiently review patient history, prescriptions, and consultation records directly from appointments within the telehealth platform.
