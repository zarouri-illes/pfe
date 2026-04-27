# BacPrep Hub — Backend Technical Reference

> **Status:** Production-ready development build. Last updated: April 2026.
> This document reflects the current, implemented state of the backend codebase.

---

## Table of Contents

1. [Project Overview & Business Rules](#1-project-overview--business-rules)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema](#5-database-schema)
6. [Server Setup](#6-server-setup)
7. [Middleware](#7-middleware)
8. [Authentication System](#8-authentication-system)
9. [API Routes — Complete Reference](#9-api-routes--complete-reference)
10. [Grading Logic](#10-grading-logic)
11. [Chargily Payment Integration](#11-chargily-payment-integration)
12. [Gemini AI Integration](#12-gemini-ai-integration)
13. [Cloudinary Integration](#13-cloudinary-integration)
14. [Error Handling Strategy](#14-error-handling-strategy)
15. [Security Checklist](#15-security-checklist)
16. [Deployment on Render](#16-deployment-on-render)
17. [Seed Data](#17-seed-data)

---

## 1. Project Overview & Business Rules

BacPrep Hub is a preparation platform for Algerian Baccalaureate students. The backend is a RESTful API written in Node.js and Express. It serves a React frontend hosted separately on Vercel. These two are completely decoupled — the frontend talks to the backend exclusively through HTTP requests.

The backend is the only layer that ever communicates with external services. The frontend never directly touches Cloudinary, Gemini, or Chargily.

**Non-negotiable business rules:**

- Browsing and downloading exam PDFs is free and requires no authentication.
- Taking a quiz costs credits (default 5 per chapter). Credits are deducted **at start**, not submission.
- The AI chatbot costs 1 credit per message. If the Gemini call fails **after** the credit is deducted, the credit is refunded automatically in the same request.
- Credits are added **only** after Chargily confirms payment via a webhook with a verified HMAC signature.
- Admin accounts are created only via the seed script — there is no HTTP endpoint that promotes a user to admin.

---

## 2. Tech Stack

| Concern | Library / Version |
|---------|------------------|
| Runtime | Node.js 20 LTS |
| Framework | Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 15+ |
| Auth | `jsonwebtoken` + `bcryptjs` |
| File uploads | `multer` + `multer-storage-cloudinary` |
| AI | `@google/genai` (Google Generative AI SDK) |
| Payment | `@chargily/chargily-pay` SDK |
| Validation | `express-validator` |
| Security | `helmet`, `cors`, `express-rate-limit` |
| Logging | `morgan` (dev only) |

> **Note on raw SQL:** The only intentional raw SQL usage is in `dashboard.controller.js` for computing average percentages across attempts (requires `CAST` + `NULLIF`) and in `quiz.controller.js` for `ORDER BY RANDOM()` question shuffling (not natively supported by Prisma).

---

## 3. Folder Structure

```
server/
├── prisma/
│   ├── schema.prisma          # Single source of truth for DB schema
│   └── seed.js                # Seeds subjects, chapters, packs, admin
├── src/
│   ├── app.js                 # Express setup — middleware + routes (no listen)
│   ├── server.js              # Entry point — DB connect then app.listen
│   ├── lib/
│   │   └── prisma.js          # Singleton PrismaClient (import from here only)
│   ├── middleware/
│   │   ├── auth.js            # JWT verification + DB user fetch
│   │   ├── admin.js           # Role check (requires auth first)
│   │   ├── credits.js         # Atomic credit deduction factory
│   │   ├── validate.js        # express-validator error formatter
│   │   └── upload.js          # Multer + Cloudinary config
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── subjects.routes.js
│   │   ├── exams.routes.js
│   │   ├── quiz.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── chatbot.routes.js
│   │   ├── credits.routes.js
│   │   └── admin.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── quiz.controller.js     # startQuiz, submitQuiz, getAttemptResults
│   │   ├── dashboard.controller.js
│   │   ├── chatbot.controller.js
│   │   ├── credits.controller.js
│   │   └── admin.controller.js
│   ├── services/
│   │   ├── geminiService.js       # Gemini API wrapper (chatbot + recommendations)
│   │   ├── chargilyService.js     # Checkout creation + HMAC verification
│   │   ├── gradingService.js      # Pure grading logic
│   │   └── cloudinaryService.js  # File deletion helper
│   └── utils/
│       └── asyncHandler.js        # Wraps async controllers for error forwarding
```

---

## 4. Environment Variables

All variables live in `server/.env` (never committed). Copy `server/.env.example` for reference.

| Variable | Description |
|----------|-------------|
| `PORT` | Server listen port (default 5000) |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | Full PostgreSQL connection string for Prisma |
| `JWT_SECRET` | Min 64 random chars — signs all tokens |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `GEMINI_API_KEY` | Google AI Studio key |
| `CHARGILY_SECRET_KEY` | Chargily main API secret (used for bearer auth AND webhook fallback) |
| `CHARGILY_WEBHOOK_SECRET` | Optional separate webhook HMAC secret. Falls back to `CHARGILY_SECRET_KEY` if missing or looks like a URL |
| `CHARGILY_MODE` | `test` or `live`. Auto-inferred from `NODE_ENV` if not set |
| `CHARGILY_LOCALE` | `fr`, `ar`, or `en` for checkout language |
| `FRONTEND_URL` | Full URL of the React frontend (used for CORS + payment redirects) |
| `BACKEND_URL` | Full public URL of this backend (used in webhook_endpoint sent to Chargily) |

---

## 5. Database Schema

### users
`id`, `name` (max 100), `email` (unique, max 150), `passwordHash`, `role` (default `student`), `creditBalance` (default 0), `createdAt`

### subjects
`id`, `name` (max 50). Currently: Mathématiques, Physique.

### chapters
`id`, `subjectId` (FK), `name` (max 150), `orderIndex`, `creditCost` (default 5)

### exams
`id`, `subjectId` (FK), `year`, `stream` (max 50), `type` (`exam` | `correction`), `fileUrl`, `publicId`, `uploadedAt`

### questions
`id`, `chapterId` (FK), `type` (`mcq` | `numerical`), `content`, `options` (JSON array | null), `correctAnswer`, `tolerance` (float, default 0), `points` (default 1)

### attempts
`id`, `userId` (FK), `chapterId` (FK), `totalScore`, `maxScore`, `creditsSpent`, `startedAt`, `submittedAt` (null until submitted)

### answers
`id`, `attemptId` (FK), `questionId` (FK), `studentAnswer`, `isCorrect`, `score`

### credit_packs
`id`, `name`, `credits`, `priceDa`, `isActive` (default true)

### transactions
`id`, `userId` (FK), `packId` (FK), `chargilyId` (unique), `amountDa`, `creditsAdded`, `status` (`pending` | `paid` | `failed`), `createdAt`

### activity
`id`, `userId` (FK), `date` (local midnight Date), `count`. Unique on `(userId, date)`. Updated via upsert on every quiz submission.

### goals
`id`, `userId` (FK), `title`, `isCompleted`, `createdAt`

---

## 6. Server Setup

The app is split into `app.js` (configuration) and `server.js` (start). Middleware is registered in this exact order:

1. `helmet()` — secure HTTP headers
2. `cors({ origin: FRONTEND_URL })` — strict origin
3. Global rate limiter: 100 req / 15 min / IP
4. `morgan('dev')` — dev only
5. **Raw body parser** on `/api/credits/webhook` only — must come **before** `express.json()`
6. `express.json()` — all other routes
7. Route files mounted
8. `/health` route
9. 404 handler
10. Global error handler (never exposes stack traces in production)

---

## 7. Middleware

### `auth.js` — `verifyToken`
Reads `Authorization: Bearer <token>`, verifies signature and expiry, then performs a **fresh DB lookup** to get the current user. Attaches full user to `req.user`. This lookup is intentional — it ensures deleted accounts stop working immediately.

### `admin.js` — `requireAdmin`
Checks `req.user.role === 'admin'`. Always placed after `verifyToken`.

### `credits.js` — `requireCredits(amount)`
Factory that returns middleware. Performs an **atomic deduction** using `updateMany` with `WHERE creditBalance >= amount` — prevents race conditions where two concurrent requests both read a sufficient balance. If the atomic update affects zero rows, returns 402. On success, updates `req.user.creditBalance` in memory and sets `req.creditsSpent`.

### `validate.js`
Wraps `express-validator`'s `validationResult`. Returns 400 with a structured `details` array on failure.

### `upload.js`
Multer + Cloudinary. Files stream directly to Cloudinary — nothing touches disk. Accepts PDFs only, max 20 MB. Folder: `bacprephub/exams`.

---

## 8. Authentication System

- JWT tokens: signed with `JWT_SECRET`, contain `{ id, email, role }`, expire per `JWT_EXPIRES_IN`.
- Passwords: bcrypt, 12 salt rounds.
- `passwordHash` is **never** returned in any API response. Use Prisma `select` to explicitly whitelist fields.
- The `user` object stored in localStorage by the frontend is now **not persisted** across sessions — `GET /api/auth/me` is the single source of truth after each page load.

---

## 9. API Routes — Complete Reference

All success responses: `{ data: ... }`. All error responses: `{ error: "..." }`. Validation errors additionally include `{ details: [{ field, message }] }`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Rate-limited (10/15min). Validates name (2–100), email, password (8+). Returns token + user. |
| POST | `/login` | Public | Rate-limited. Returns token + user including `creditBalance`. |
| GET | `/me` | JWT | Returns fresh user from DB. Used on every page load. |

### Subjects — `/api/subjects`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | All subjects with nested chapters (including `creditCost`), ordered by `orderIndex`. |

### Exams — `/api/exams`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | Accepts `subjectId`, `year`, `stream`, `type` as optional query params. Returns `fileUrl` for direct browser open. |

### Quiz — `/api/quiz`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/start` | JWT + credits | Body: `{ chapterId }`. Deducts chapter's `creditCost`. Returns `{ attemptId, questions }` — questions are stripped of `correctAnswer` and `tolerance`. |
| POST | `/submit` | JWT | Body: `{ attemptId, answers }`. Validates that `answers` is a non-empty array, each item has `questionId` (int ≥ 1) and `answer`. Verifies attempt ownership. Returns full breakdown with `{ score, maxScore, percentage, breakdown }`. |
| GET | `/:attemptId/results` | JWT | Fetches completed attempt results from DB. Enables page refresh without data loss. Verifies attempt ownership (403 if not owner). |

### Dashboard — `/api/dashboard`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | JWT | Single aggregated request. All 6 DB queries run **in parallel** via `Promise.all`. Returns: `creditBalance`, `daysUntilBac`, `recentAttempts` (last 5), `chapterStats`, `weakestChapters` (≥2 attempts), `subjectStats`, `heatmap` (last 12 months), `goals`, `recommendations` (Gemini AI, falls back gracefully). |

### Chatbot — `/api/chatbot`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | JWT + 1 credit | Body: `{ message }` (max 500 chars). Responds in the language of the student's message (Arabic, French, or English). Credit is refunded automatically if Gemini fails. |

### Credits — `/api/credits`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/packs` | Public | Active packs only, ordered by price. |
| POST | `/checkout` | JWT | Creates Chargily checkout. Stores pending transaction. Returns `{ checkoutUrl }`. |
| POST | `/webhook` | Raw body | Verifies HMAC-SHA256 signature (timing-safe). Idempotency-checked via `chargilyId`. Atomically adds credits + marks transaction paid. Always returns 200. |
| GET | `/history` | JWT | Student's transaction history, newest first. |

### Admin — `/api/admin` (JWT + admin role required on all routes)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Total students, questions, exams, revenue, most attempted chapter. |
| POST | `/exams` | Multipart upload. Cloudinary processes before controller runs. |
| DELETE | `/exams/:id` | Deletes from Cloudinary first, then DB. |
| GET | `/questions` | Paginated, filterable by `chapterId`, `subjectId`, `type`. |
| POST | `/questions` | Conditional validation by type (MCQ vs numerical). |
| PUT | `/questions/:id` | Same conditional validation. |
| DELETE | `/questions/:id` | Returns 409 if answers reference this question. |
| GET | `/credit-packs` | All packs including inactive. |
| POST | `/credit-packs` | Create pack. |
| PUT | `/credit-packs/:id` | Update/toggle. |
| GET | `/students` | All registered students. |
| GET | `/transactions` | All payment transactions. |

---

## 10. Grading Logic

Pure function in `gradingService.js` — no DB calls, no side effects.

- **MCQ:** Trim + exact string match against `correctAnswer`.
- **Numerical:** Parse both as floats. Check `|student - correct| <= tolerance`. Tolerance 0 = exact match.
- Extra answers beyond question count: ignored.
- Missing answers: treated as wrong (0 points).
- All `Answer` records created in a single batch inside a Prisma `$transaction` with the Attempt update.

---

## 11. Chargily Payment Integration

- SDK: `@chargily/chargily-pay`
- Mode: resolved from `CHARGILY_MODE` env var, falls back to `NODE_ENV`.
- Checkout URL: normalized to HTTPS only (no hostname rewriting).
- Webhook `success_url` and `failure_url` use `FRONTEND_URL`. `webhook_endpoint` uses `BACKEND_URL`.
- **Webhook secret fallback:** If `CHARGILY_WEBHOOK_SECRET` is missing or looks like a URL, the service falls back to `CHARGILY_SECRET_KEY` for HMAC verification.
- Signature comparison is **timing-safe** (`crypto.timingSafeEqual`).
- Webhook is **idempotent** — duplicate deliveries are silently no-ops.

---

## 12. Gemini AI Integration

- SDK: `@google/genai`
- Model: **`gemini-1.5-flash-latest`** (stable alias — do not use `gemini-1.5-flash` without `-latest`)
- System instruction is passed as `systemInstruction`, not as a user message.
- **Multi-language:** Detects student's language (Arabic, French, English) and responds in the same language.
- Scope restriction: Algerian Terminale Maths & Physics only. Politely declines off-topic requests.
- Recommendation engine: Also uses `getStudyRecommendations(weakestChapters)` in the dashboard controller, with a graceful fallback string if the call fails.
- Every chatbot request is **stateless** (no conversation history across calls).
- Failed Gemini call after credit deduction → 1 credit is refunded via direct DB update.

---

## 13. Cloudinary Integration

- All PDF operations use `resource_type: 'raw'`. Using `auto` or `image` breaks PDF URLs.
- Upload saves both `secure_url` (→ `fileUrl`) and `public_id` to DB.
- Deletion: `public_id` from DB → Cloudinary destroy → then DB record delete. If Cloudinary fails, DB record is kept.

---

## 14. Error Handling Strategy

- All async handlers wrapped with `asyncHandler` utility.
- Global error handler at bottom of `app.js`. In production: no stack trace. In dev: logged.
- Prisma unique violation → 409. Record not found → 404. Other Prisma errors → 500.

**HTTP status codes used:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation / already-submitted quiz |
| 401 | Missing/invalid token |
| 402 | Insufficient credits |
| 403 | Valid token, wrong role or attempt ownership |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, question with answers) |
| 500 | Unexpected server error |

---

## 15. Security Checklist

- [x] `passwordHash` never in any API response — Prisma `select` used on all user queries
- [x] JWT secret ≥ 64 chars
- [x] CORS restricted to `FRONTEND_URL` — no wildcard
- [x] Chargily webhook: HMAC verified with `timingSafeEqual` before any processing
- [x] Webhook uses raw body parser, registered **before** `express.json()`
- [x] Webhook is idempotent — `chargilyId` uniqueness check before crediting
- [x] Credit deduction is atomic — `updateMany` with `WHERE creditBalance >= amount`
- [x] Quiz submit verifies attempt ownership — 403 on mismatch
- [x] Quiz submit validates each answer item schema (`questionId` + `answer` fields)
- [x] File uploads: PDF MIME only, 20 MB max
- [x] Admin routes: both `verifyToken` **and** `requireAdmin`
- [x] Rate limiting: 10/15min on auth routes, 100/15min global
- [x] `.env` in `.gitignore`

---

## 16. Deployment on Render

- Service type: Web Service
- Root directory: `server/`
- Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start command: `node src/server.js`
- All env vars set in Render's environment panel
- `DATABASE_URL` must use Render's **internal** connection string

> Render free tier pauses after 15 min of inactivity. First request triggers a ~30s cold start. Acceptable for demo environments.

---

## 17. Seed Data

Run with: `npx prisma db seed`

- **Admin account:** `admin@bacprephub.dz`, role `admin`, balance 9999
- **Subjects:** Mathématiques, Physique
- **Chapters (Maths, 10):** Suites numériques, Limites et continuité, Dérivation, Étude de fonctions, Calcul intégral, Équations différentielles, Nombres complexes, Probabilités, Géométrie dans l'espace, Statistiques
- **Chapters (Physique, 9):** Mécanique — Cinématique, Mécanique — Dynamique, Mécanique — Travail et Énergie, Électricité — Circuits RC et RL, Électricité — Oscillations, Optique géométrique, Ondes mécaniques, Radioactivité et noyau, Spectroscopie
- **Credit packs (4):**
  - Pack Débutant: 300 DA → 50 crédits
  - Pack Standard: 600 DA → 120 crédits
  - Pack Premium: 1 200 DA → 300 crédits
  - Pack Révision: 2 000 DA → 600 crédits

All upserts — safe to run multiple times.
