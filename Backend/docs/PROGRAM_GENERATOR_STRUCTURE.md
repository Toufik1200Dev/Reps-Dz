# Program Generator – How It Works

This document describes the structure and flow of the calisthenics program generator (1-week free and 6-week paid).

---

## Overview

| Plan        | Price    | Output              | Delivery                    | Backend entry              |
|------------|----------|---------------------|-----------------------------|----------------------------|
| **1 Week** | Free     | 1 week, 4 days      | Shown on screen + optional save | `POST /api/programs/generate` + `POST /api/programs/save` |
| **6 Weeks**| $29.98   | 6 weeks, 5 days/week| Email only                  | `POST /api/programs/send-6week-email` |

---

## High-level flow

```
Frontend (Programs.jsx)
    │
    ├── Plan: Free (1 Week)
    │       │
    │       ├── User fills: level, maxReps (name optional)
    │       ├── POST /api/programs/generate  → 1-week program JSON
    │       ├── Display program on page
    │       └── POST /api/programs/save     → store in DB (ProgramSave)
    │
    └── Plan: Paid (6 Weeks)
            │
            ├── User fills: email (required), maxReps, optional: name, height, weight
            ├── POST /api/programs/send-6week-email
            ├── Backend: generate 6-week program → send email → save SixWeekRequest
            └── Frontend: show success “Program sent to your email”
```

---

## 1-Week (Free) generator

### Routes

- **`POST /api/programs/generate`** – generate one 1-week program.
- **`POST /api/programs/save`** – save a generated program (userName, deviceId, level, maxReps, program).

### Logic (programController.js)

1. **Validate**  
   - `level`: `beginner` | `intermediate` | `advanced`  
   - `maxReps`: object with `muscleUp`, `pullUps`, `dips`, `pushUps`, `squats`, `legRaises` (numbers, within safety limits).  
   - Beginner: `muscleUp` forced to 0.

2. **Generate program**  
   - If `OPENROUTER_API_KEY` is set: call **OpenRouter** (GPT) with a structured prompt; on failure, fall back to algorithm.  
   - Else: use built-in **algorithm** (`generate4WeekProgram` in controller).  
   - Output: array of 1 week with 4 days (Pull, Push, Legs+Core+Cardio, Endurance Integration).

3. **Response**  
   - `{ success, data: { level, maxReps, program } }`.

### Save (optional, from frontend)

- Frontend calls **`POST /api/programs/save`** with `userName`, `deviceId`, `level`, `maxReps`, `program`.  
- Stored in **ProgramSave** (MongoDB). Used for admin stats and “saved programs”.

---

## 6-Week (Paid) generator

### Route

- **`POST /api/programs/send-6week-email`** – generate 6-week program, send by email, record request.

### Body

- **Required:** `email`, `maxReps` (same shape as 1-week).  
- **Optional:** `userName`, `level`, `heightCm`, `weightKg`, `programId` (seed).

### Logic (programController.js → generateAndSend6WeekEmail)

1. **Validate**  
   - Valid email.  
   - `maxReps` present and all exercises non-negative, within safety limits.

2. **Generate program**  
   - `generate6WeekProgram(level, maxReps, seed, { heightCm, weightKg })`  
   - Implemented in **`services/programGenerator6Week.js`**.

3. **Send email**  
   - `sendProgramEmail(email, userName, result)`  
   - Implemented in **`services/emailService.js`** (Brevo API, HTML body).

4. **Record request**  
   - Create **SixWeekRequest** (email, userName, level) for admin/analytics.

5. **Response**  
   - `{ success, message, data: { email } }`.

### Service: programGenerator6Week.js

- **Level:** from input or **auto-detected** from `maxReps` (`detectLevelFromReps`).  
- **Weeks 1–6:** intensity curve (intro → build → high → high → deload → taper). Week 6 includes a max-reps test day.  
- **Schedule:** 5 training days per week; rest after every 2 workout days (e.g. Mon–Tue train, Wed rest, Thu–Fri train, Sat rest, Sun train).  
- **Concepts used:**  
  - `calculateSmartReps` – rep prescription with diminishing factor for high-rep athletes.  
  - `getDynamicRest` – rest by week and type (strength/endurance).  
  - `getAustralianPullUpReps` – Australian pull-up reps (e.g. when pull-ups are low).  
  - Cluster sets, chipper, endurance methods.  
- **Nutrition (optional):** if `heightCm` and `weightKg` are provided, **`calculateNutrition`** returns BMR, TDEE (5× training), protein (g).  
- **Output:** `{ level, maxReps, program: [weeks], nutrition, plannedWeekDescription }`.

### Service: emailService.js

- **Config:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optional `PROGRAM_EMAIL_FROM`.  
- **`sendProgramEmail(to, userName, programData)`** builds HTML from `programData` (weeks, days, exercises, nutrition) and sends one email per 6-week request.

---

## Data models

| Model            | Use                                      |
|------------------|------------------------------------------|
| **ProgramSave**  | 1-week programs saved from the generator |
| **SixWeekRequest** | 6-week paid requests (email, userName, level, createdAt) |

---

## Admin / analytics

- **Generator stats** (`GET /api/admin/stats/generator`):  
  - 1-week: counts and list from **ProgramSave**.  
  - 6-week: `sixWeekTotal` and `sixWeekRequests` from **SixWeekRequest**.  
- **Dashboard / Analytics:** use these stats plus frontend analytics (page views, product clicks, program events).

---

## File map

| Role                | File(s) |
|---------------------|--------|
| API routes          | `routes/programRoutes.js` |
| 1-week + 6-week API | `controllers/programController.js` |
| 6-week program logic| `services/programGenerator6Week.js` |
| 6-week email        | `services/emailService.js` |
| 1-week save         | `models/ProgramSave.js` |
| 6-week requests     | `models/SixWeekRequest.js` |
| Frontend UI         | `Frontend/src/pages/Programs.jsx` |
| Translations (price)| `Frontend/src/contexts/LanguageContext.jsx` (e.g. `programs.planPaidPrice` = $29.98) |

---

## Price

- **6-week plan:** **$29.98** (set in `LanguageContext.jsx` as `programs.planPaidPrice`, and fallback in `Programs.jsx`).
