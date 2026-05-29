# Telehealth Application — Requirements Document

## Overview

This document outlines the functional requirements for a telehealth platform with two primary user-facing modules: the **Patient Module** and the **Doctor Module**.

---

## User Roles

| Role | Description |
|------|-------------|
| **Patient** | End-user who books and attends consultations |
| **Doctor** | Medical professional who manages schedules, consultations, prescriptions, and notes |

---

## Patient Module

Patient-facing features that cover registration, discovery, booking, consultation, and medical records.

### 1. Patient Account Creation

Allows patients to securely register and create their own telehealth account. This module serves as the entry point to the platform.

| Detail | Requirement |
|--------|-------------|
| Register using email and password | ✅ Required |
| Add personal information to profile | ✅ Required |

**Profile fields include:**

- Name
- Birthday
- Weight & Height
- Profile Picture
- Contact Details
- Basic Medical History

---

### 2. Doctor Discovery

Enables patients to browse available doctors and review their schedules before booking consultations.

| Detail | Requirement |
|--------|-------------|
| Browse doctors and view their availability | ✅ Required |
| Explore doctors based on medical needs/symptoms | ✅ Required |
| Filter/search doctors by specialization | ✅ Required |

---

### 3. AI Recommendation

Allows patients to describe their symptoms or healthcare concerns and receive suggested doctors based on specialization or expertise.

| Detail | Requirement |
|--------|-------------|
| AI recommends a doctor based on patient needs | ✅ Required |

---

### 4. Appointment Booking

Allows patients to schedule online consultations with doctors based on available schedules.

| Detail | Requirement |
|--------|-------------|
| Book consultations online | ✅ Required |
| Reschedule or cancel schedules | ✅ Required |
| Real-time push notifications for booked appointments, upcoming appointments, and schedule updates | ✅ Required |

---

### 5. Consultation Session

Provides patients access to a virtual consultation experience where they can join their scheduled appointment online.

> **Note:** The consultation session does not require a fully custom-built video conferencing solution.

| Detail | Requirement |
|--------|-------------|
| Join a consultation session | ✅ Required |

---

### 6. Medical Records

Allows patients to review their previous consultations and view records provided by doctors after each session.

| Detail | Requirement |
|--------|-------------|
| View appointment history | ✅ Required |
| View basic medical records or prescriptions | ✅ Required |

---

## Doctor Module

Doctor-facing features covering profile management, schedule management, patient records access, and consultation tools.

### 1. Doctor Profile Management

Allows doctors to securely register and create their own account.

| Detail | Requirement |
|--------|-------------|
| Register using email and password | ✅ Required |
| Add profile details, bio, and specialization | ✅ Required |

---

### 2. Medical Records Access

Enables doctors to review patient consultation history and previously issued records or prescriptions.

| Detail | Requirement |
|--------|-------------|
| View appointment history and medical records/prescriptions | ✅ Required |

---

### 3. Consultation Schedule Management

Allows doctors to manage their consultation availability and ensure schedules are properly organized.

| Detail | Requirement |
|--------|-------------|
| Manage consultation schedules | ✅ Required |
| Restrict unavailable time slots | ✅ Required |
| Real-time push notifications for booked appointments, upcoming appointments, and schedule updates | ✅ Required |

---

### 4. Consultation Notes & Prescriptions

Allows doctors to document findings, recommendations, prescriptions, and consultation summaries after each appointment.

| Detail | Requirement |
|--------|-------------|
| Add prescriptions and/or medical consultation notes | ✅ Required |

---

### 5. Consultation Session

Enables doctors to join and conduct virtual consultations with patients.

> **Note:** The consultation session does not require a fully custom-built video conferencing solution.

| Detail | Requirement |
|--------|-------------|
| Join a consultation session | ✅ Required |

---

## Feature Summary

| Module | Feature | Requirement |
|--------|---------|-------------|
| Patient | Account Creation | ✅ Required |
| Patient | Doctor Discovery | ✅ Required |
| Patient | AI Recommendation | ✅ Required |
| Patient | Appointment Booking | ✅ Required |
| Patient | Consultation Session | ✅ Required |
| Patient | Medical Records | ✅ Required |
| Doctor | Profile Management | ✅ Required |
| Doctor | Medical Records Access | ✅ Required |
| Doctor | Schedule Management | ✅ Required |
| Doctor | Consultation Notes & Prescriptions | ✅ Required |
| Doctor | Consultation Session | ✅ Required |
