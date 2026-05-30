# 🚀 Telehealth Pro — Feature Enhancements

> This document outlines the planned enhancements to Telehealth Pro, covering improvements to prescription management, in-call consultation tools, and schedule management for doctors.

---

## 1. 💊 Enhanced Prescription Management

### 1.1 Multiple Prescriptions at Once

**Current Behavior:**
Doctors can issue a single prescription following a consultation.

**Enhancement:**
Doctors can now add multiple prescription entries in a single session using a dynamic form with an **"Add More"** button.

**Key Behaviors:**

- The prescription form starts with one entry row by default.
- Each row contains the standard fields: **Medication Name**, **Dosage**, **Frequency**, **Duration**, and **Notes/Instructions**.
- Clicking **"+ Add More"** appends a new blank prescription row below the existing ones.
- Each row has a **Remove (×)** button to delete it (the first row's remove button is disabled if it is the only entry).
- On submission, all rows are validated and saved as a batch linked to the same appointment/consultation.
- A minimum of one prescription entry is required to submit.

**UI Notes:**

- Rows are visually separated with a subtle divider.
- A running count is shown (e.g., *"Prescription 1 of 3"*) for clarity.
- The form is scrollable if many entries are added.

---

### 1.2 Prescribe During Video Call

**Current Behavior:**
Prescriptions can only be issued after a consultation from the appointment details view.

**Enhancement:**
Doctors can open and submit a prescription form directly within the active video consultation room.

**Key Behaviors:**

- A **"Write Prescription"** button/icon is available in the in-call toolbar or side panel.
- Clicking it opens a slide-over/drawer panel on the right side of the screen without interrupting the video feed.
- The prescription form inside the panel supports multiple entries (see Section 1.1).
- Submitted prescriptions are saved immediately and associated with the current appointment.
- A success toast notification confirms the prescription was saved.
- Previously written prescriptions for this appointment are visible (read-only) at the top of the panel.

**UI Notes:**

- The panel should be non-blocking — the doctor can dismiss it and return to the call.
- Panel width: approximately 380–420px on desktop, full-screen on mobile.

---

## 2. 🩺 In-Call Diagnosis & Consultation Notes

### 2.1 Create a Diagnosis During Video Call

**Current Behavior:**
No diagnosis entry tool exists within the video consultation room.

**Enhancement:**
Doctors can document a diagnosis and clinical notes directly from the active video call interface.

**Key Behaviors:**

- A **"Add Diagnosis"** button is available in the in-call toolbar or side panel alongside the prescription tool.
- Clicking it opens a dedicated **Diagnosis Panel** (slide-over/drawer, similar to the prescription panel).
- The Diagnosis Panel includes the following fields:

| Field | Type | Required |
|---|---|---|
| Primary Diagnosis | Text input / ICD-10 code search | Yes |
| Secondary Diagnosis(es) | Multi-entry (similar to prescriptions) | No |
| Chief Complaint | Textarea | Yes |
| Clinical Notes / Findings | Rich textarea | No |
| Follow-up Required | Toggle (Yes / No) | No |
| Follow-up Date | Date picker (shown if toggle is Yes) | Conditional |

- Diagnosis data is auto-saved as a draft while the call is ongoing.
- On submission, the diagnosis is finalized and linked to the appointment's EMR record.
- A confirmation toast is shown upon saving.
- The panel can be reopened mid-call to edit the diagnosis before the session ends.

**Workflow Integration:**

- When the doctor clicks **"End & Complete"** to close the session, a prompt appears if a diagnosis has not been saved, asking: *"You have an unsaved diagnosis. Save before ending?"*

**UI Notes:**

- The Diagnosis Panel and Prescription Panel can be toggled independently.
- Both panels must not overlap; only one is open at a time.

---

## 3. 📅 Schedule Management — Add Schedule Modal

### 3.1 Add New Schedule via Fill-Up Modal

**Current Behavior:**
Doctors receive a default 30-day schedule (weekdays, 9 AM – 5 PM) on registration and can customize it, but there is no explicit "Add Schedule" UI on the Schedule Management page.

**Enhancement:**
A clear **"+ Add Schedule"** button is added to the Schedule Management page. Clicking it opens a modal that allows doctors to define new availability slots.

**Modal: Add Schedule**

The modal contains the following sections:

**① Select Day(s)**

- A visual **day selector** displaying all 7 days of the week (Mon–Sun) as toggleable chips/buttons.
- Doctors can select **one or multiple days** in a single operation.
- Selected days are highlighted (using the platform's Cyan/Emerald palette).

**② Select Time Range**

- **Start Time** — time picker (dropdowns or a clock UI, in 30-minute increments).
- **End Time** — time picker; must be later than Start Time (validated on submit).
- Option to add **multiple time slots per selection** (e.g., 9 AM–12 PM and 2 PM–5 PM on the same days) via an **"+ Add Time Slot"** link within the modal.

**③ Recurrence (Optional)**

- A toggle for **Repeat Schedule**:
  - **None** — applies only to the selected days in the current week.
  - **Weekly** — repeats every week indefinitely or until a set end date.
  - **Custom Range** — a date range picker to specify the start and end date of the recurrence.

**④ Actions**

- **Save Schedule** — validates and creates the schedule entries.
- **Cancel** — closes the modal without saving.

**Key Behaviors:**

- At least one day and one valid time range must be selected to enable the Save button.
- Conflict detection: if a new slot overlaps with an existing schedule, a warning is shown (non-blocking — doctor can choose to override or cancel).
- On success, the Schedule Management page refreshes/updates to reflect the newly added slots.
- A success toast: *"Schedule added successfully."*

**UI Notes:**

- Modal size: medium (approx. 520px wide on desktop).
- Day chips are arranged in a single horizontal row (Mon → Sun).
- Mobile: modal becomes a bottom sheet; day chips wrap into two rows if needed.

---

## 📋 Summary of Changes

| Feature | Area | Impact |
|---|---|---|
| Multiple prescriptions (Add More) | Prescription Form | Doctor Portal |
| Prescribe during video call | In-Call Tools | Doctor Portal |
| Diagnosis creation during video call | In-Call Tools | Doctor Portal |
| Add Schedule modal with day/time picker | Schedule Management | Doctor Portal |

---

*Document version: 1.0 — Prepared for development sprint planning.*
