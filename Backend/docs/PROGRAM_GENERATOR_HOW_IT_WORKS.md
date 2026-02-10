# How the Program Generator Works

This document explains how the calisthenics program generator produces 1-week (free) and 6-week (paid) programs, from the frontend form through the API to PDF delivery.

---

## Overview

| Plan | Price | Days per week | Delivery | Generation |
|------|-------|----------------|----------|------------|
| **1 Week** | Free | 4 training days | On screen + optional save/email | OpenRouter AI or fallback algorithm |
| **6 Weeks** | $29.98 | 5 training days | Email (PDF) | Built-in algorithm |

---

## End-to-End Flow

```
Frontend (Programs.jsx)
    │
    ├── User fills: level, maxReps, goals (when calisthenics main sport), height, weight, etc.
    │
    ├── 1-WEEK FREE:
    │   ├── POST /api/programs/generate → JSON program
    │   ├── Display on page
    │   └── Optional: POST /api/programs/send-free-email → email with PDF
    │
    └── 6-WEEK PAID:
        ├── POST /api/programs/create-paypal-order → PayPal checkout
        └── After payment: webhook fulfills order
            └── generate 6-week → PDF → email
```

---

## 1-Week (Free) Generator

### Routes

- **`POST /api/programs/generate`** – generates a 1-week program, returns JSON.
- **`POST /api/programs/send-free-email`** – generates 1-week program, creates PDF, sends email with attachment.

### Generation Logic

1. **OpenRouter (AI)** – If `OPENROUTER_API_KEY` is set:
   - Sends a structured prompt to GPT via OpenRouter.
   - Prompt includes: level, max reps, regressions for weak exercises, sport-specific emphasis.
   - Returns a JSON `{ program: [{ week, days }] }` with 1 week × 4 days.

2. **Fallback algorithm** – If AI fails or no API key:
   - Uses built-in logic in the controller.
   - Produces 4 days: Pull, Push, Legs+Core+Cardio, Endurance.

### 1-Week Output Structure

- **1 week**, **4 training days**:
  - Day 1: Pull
  - Day 2: Push
  - Day 3: Legs + Core + Cardio
  - Day 4: Endurance Integration

Each day has: warm-up, main exercises (with sets/reps/rest), optional notes.

---

## 6-Week (Paid) Generator

### Route

- **`POST /api/programs/create-paypal-order`** – creates PayPal order.
- **Webhook** – on successful payment, calls `fulfillProgramFromPayPalData`, which generates the 6-week program, creates PDF, and sends it by email.

### Generation Logic (`programGenerator6Week.js`)

The 6-week program is built entirely by the algorithm (no AI). Main steps:

1. **Level detection**
   - Uses `detectLevelFromReps(maxReps)`:
     - Beginner: pull < 5, dips < 10
     - Advanced: pull ≥ 20, muscle-ups ≥ 5 or dips ≥ 40
     - Otherwise: intermediate

2. **6-week intensity curve**

   | Week | Style | Volume | Intensity |
   |------|-------|--------|-----------|
   | 1 | Intro | 50% | 50% |
   | 2 | Build | 65% | 65% |
   | 3 | High | 82% | 82% |
   | 4 | High | 88% | 88% |
   | 5 | Deload | 65% | 65% |
   | 6 | Taper | 50% | 50% (Day 5 = max reps test) |

3. **Weekly schedule (5 training days)**

   - Mon: Pull
   - Tue: Push
   - Wed: Rest
   - Thu: Legs + Core + Cardio
   - Fri: Endurance Integration
   - Sat: Rest
   - Sun: Strength / Weights (or max reps test in week 6)

4. **Training methods**

   - **SET** – sequence of exercises with no rest between.
   - **DEGRESSIVE** – reps decrease each round.
   - **PROGRESSIVE** – volume increases week to week.
   - **EMOM** – every minute on the minute.
   - **AMRAP** – as many rounds/reps as possible.
   - **NO STOP** – exercises back-to-back until round is done.
   - **ISOMETRIC HOLD** – static hold.
   - **Cluster Sets** – short rest between mini-sets within a set.

   The generator picks methods per day and week (e.g. Pull: DEGRESSIVE, EMOM; Push: SET, ISOMETRIC; Legs: SET, AMRAP).

5. **Smart rep prescription**

   - `calculateSmartReps(maxReps, intensity)` – scales reps by intensity and applies a diminishing factor for high-rep athletes.
   - `getAustralianPullUpReps(pullReps, week)` – substitutes Australian pull-ups when pull-ups are low (e.g. beginners).
   - `getDynamicRest(week, type)` – rest periods change by week (e.g. 90s → 75s → 60s → 45s).

6. **Goal-based workout adjustments**

   When goals are provided (calisthenics as main sport):
   - **lose_weight**: more cardio, shorter rest, higher AMRAP time on Legs day.
   - **improve_endurance**: higher volume cap on Endurance day, more cardio, longer AMRAP.
   - **build_muscle** / **learn_skills**: standard volumes, no extra cardio emphasis.

---

## Goal-Based Nutrition

### Goals (calisthenics main sport)

- `lose_weight`
- `improve_endurance`
- `build_muscle`
- `learn_skills`

### `calculateNutrition(heightCm, weightKg, goals)`

1. **BMR** – Mifflin–St Jeor (10×weight + 6.25×height − 5×30 + 5).
2. **TDEE** – BMR × activity factor (1.55 for 5× training/week).
3. **Goal adjustments**:
   - **lose_weight**: TDEE × 0.9, protein 2.0 g/kg.
   - **build_muscle**: TDEE × 1.08, protein 2.2 g/kg.
   - **improve_endurance**: TDEE × 1.02 (slight surplus).
   - **learn_skills**: maintenance, standard protein (~1.8 g/kg).

4. **Sample meal plan** – optional breakdown by time of day (breakfast, lunch, dinner, snacks), scaled to TDEE and protein.

---

## PDF Generation (`programPdfService.js`)

### 6-week PDF

1. **Cover page** – program title, level, goals (if any), user name/age, date, max reps table.
2. **Training methods** – definitions (SET, DEGRESSIVE, EMOM, etc.).
3. **Warm-ups** – general guidelines.
4. **Weeks 1–6** – each week: schedule + days with exercises, sets, rest, notes.
5. **Nutrition** – daily calorie target, protein, goal-specific note, sample meals when available.

### 1-week PDF

1. **Cover** – title, level, goals (if any), max reps.
2. **Nutrition** – calorie target, protein, hydration.
3. **Week 1** – 4 sessions with exercises.

### Goal display

If `goals` is provided in the options, both PDFs show “Goal: Lose Weight, Improve Endurance” etc. on the cover.

---

## Data Flow (goals)

1. **Frontend** – User selects goals (only when calisthenics is main sport). Sent in API payloads.
2. **1-week free email** – `send1WeekProgramEmail` receives `goals`, passes them to `generate1WeekPdfBuffer`.
3. **6-week paid** – `goals` stored in `PendingPayPalOrder` at checkout; on fulfillment, passed to `generate6WeekProgram` and `sendProgramEmail`.
4. **Generator** – `generate6WeekProgram(level, maxReps, seed, { heightCm, weightKg, goals })` uses goals for:
   - `calculateNutrition(..., goals)`
   - `generateWeekDays6(..., goals)` → Day 3 and Day 4 apply goal-based cardio/rest/volume.

---

## File Map

| Purpose | File |
|---------|------|
| API routes | `routes/programRoutes.js` |
| Controllers (validate, orchestrate) | `controllers/programController.js` |
| 6-week algorithm | `services/programGenerator6Week.js` |
| PDF generation | `services/programPdfService.js` |
| Email + Brevo | `services/emailService.js` |
| PayPal | `services/paypalService.js` |
| Pending orders (incl. goals) | `models/PendingPayPalOrder.js` |
| Frontend form | `Frontend/src/pages/Programs.jsx` |

---

## Summary

- **1-week**: AI (OpenRouter) or algorithm; 4 days; JSON or PDF email.
- **6-week**: Algorithm only; 5 days/week; 6-week intensity curve; methods (SET, DEGRESSIVE, EMOM, etc.); delivered by email as PDF.
- **Goals**: Optional; affect nutrition (TDEE, protein) and workout design (cardio, rest, volume) when calisthenics is the main sport.
- **PDF**: Cover, methods, weeks, nutrition; goals shown on cover when provided.
