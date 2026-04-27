# BacPrep Hub — Frontend Technical Reference

> **Status:** Production-ready development build. Last updated: April 2026.
> This document reflects the current, implemented state of the frontend codebase.

---

## Table of Contents

1. [Project Overview & Core Rule](#1-project-overview--core-rule)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Environment Variables](#4-environment-variables)
5. [API Client & HTTP Strategy](#5-api-client--http-strategy)
6. [Authentication Context](#6-authentication-context)
7. [Routing & Access Control](#7-routing--access-control)
8. [Pages — Complete Reference](#8-pages--complete-reference)
9. [Key Interaction Flows](#9-key-interaction-flows)
10. [Components](#10-components)
11. [API Calls Reference](#11-api-calls-reference)
12. [UI Rules & Design Conventions](#12-ui-rules--design-conventions)
13. [Form Handling](#13-form-handling)
14. [Error Handling Strategy](#14-error-handling-strategy)
15. [Deployment on Vercel](#15-deployment-on-vercel)

---

## 1. Project Overview & Core Rule

BacPrep Hub is a React single-page application that serves as the student-facing and admin-facing interface for the platform. It communicates exclusively with the BacPrep Hub backend REST API. The frontend owns zero business logic — it renders, routes, collects input, and displays what the backend returns.

**Core rule:** The frontend never calls Cloudinary, Gemini, or Chargily directly. Every external service is accessed through the backend API. The only external redirect the frontend initiates is sending the student to Chargily's hosted payment page — and even then, the URL comes from the backend.

---

## 2. Tech Stack

| Concern | Library |
|---------|---------|
| Build tool | Vite |
| UI framework | React 18 (functional components + hooks only) |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Component library | Shadcn/ui (Radix UI primitives) |
| HTTP client | **Native `fetch` API** — wrapped in `src/api/client.js` |
| Charts | Recharts (dashboard bar/pie charts) |
| Animations | Framer Motion (page entrance, list stagger, transitions) |
| Icons | Lucide React |
| Global state | React Context (auth only — no Redux, Zustand, etc.) |
| Toasts | Sonner |

> **Note:** The HTTP client is **not Axios**. It is a custom `fetch` wrapper at `src/api/client.js`. Do not introduce Axios.

---

## 3. Folder Structure

```
client/
├── public/
│   └── (static assets)
├── src/
│   ├── api/
│   │   └── client.js              # fetch wrapper — the only HTTP client
│   ├── components/
│   │   ├── ui/                    # Shadcn UI components (do not edit manually)
│   │   │   └── skeleton.jsx       # Custom glass-shimmer skeleton
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── AdminLayout.jsx
│   │   ├── StudentLayout.jsx
│   │   └── ChatbotWidget.jsx      # Global floating AI assistant
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   └── useAuth.js
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ExamLibrary.jsx
│   │   ├── QuizSelect.jsx
│   │   ├── QuizActive.jsx
│   │   ├── QuizResults.jsx        # Now fetches from API on refresh
│   │   ├── Credits.jsx
│   │   ├── PaymentSuccess.jsx
│   │   ├── PaymentFail.jsx
│   │   └── admin/
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminExams.jsx
│   │       ├── AdminQuestions.jsx
│   │       ├── AdminPacks.jsx
│   │       ├── AdminStudents.jsx
│   │       └── AdminTransactions.jsx
│   ├── App.jsx                    # Route tree + InsufficientCreditsHandler
│   └── main.jsx
├── .env                           # Never commit
├── .env.example
├── vercel.json
└── vite.config.js
```

---

## 4. Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL. `http://localhost:5000` in dev, Render URL in prod. Used only in `src/api/client.js`. |

> `VITE_` prefix is mandatory for Vite to expose variables in the browser bundle.

---

## 5. API Client & HTTP Strategy

**File:** `src/api/client.js`

A thin wrapper around the native `fetch` API. All API calls in the entire application import from this single file.

```js
const api = async (path, options = {}) => { ... }
export default api;
```

**What it does automatically:**

1. Prepends `VITE_API_URL` to every path.
2. Adds `Content-Type: application/json` unless the body is `FormData`.
3. Reads the JWT from `localStorage.token` and adds `Authorization: Bearer <token>` to every request.
4. **Global 401 handling:** Clears `localStorage.token` and `localStorage.user`, throws `'Session expired'`. ProtectedRoute handles the redirect — this prevents redirect loops on guest-accessible pages.
5. **Global 402 handling:** Dispatches a custom DOM event `'insufficient-credits'`. `InsufficientCreditsHandler` in `App.jsx` listens and navigates to `/credits` via React Router — **no full page reload**.
6. Parses the JSON response and throws a structured error (`error.message`, `error.status`, `error.data`) for non-OK responses.

**402 event flow:**
```
api call fails with 402
  → window.dispatchEvent(new CustomEvent('insufficient-credits'))
  → InsufficientCreditsHandler in App.jsx
  → navigate('/credits')   ← stays inside React Router
```

---

## 6. Authentication Context

**File:** `src/context/AuthContext.jsx`

Provides auth state to the entire app. Wrapped around everything in `main.jsx`.

**State:**

| Field | Type | Description |
|-------|------|-------------|
| `user` | object \| null | Full user object from backend |
| `token` | string \| null | Raw JWT string |
| `creditBalance` | number | Kept separate for frequent updates without replacing user |
| `isLoading` | boolean | True during initial token verification |
| `isAuthenticated` | boolean | Derived: `!!user` |

**Methods:**

- `login(token, userData)` — Saves token to `localStorage.token`. **Does NOT persist the user object** in localStorage — the user is always re-fetched from `/api/auth/me` on page load. Updates context state.
- `logout()` — Clears localStorage, resets state.
- `updateCredits(newBalance)` — Updates `creditBalance` in context. Called after every credit-changing action.

**On mount:** If `localStorage.token` exists, `GET /api/auth/me` is called to validate the token and restore state. `isLoading` is true during this check — `ProtectedRoute` waits for it.

---

## 7. Routing & Access Control

All routes defined in `App.jsx`.

**Route access levels:**

- **Public** — anyone, authenticated or not.
- **Protected** — `ProtectedRoute` checks `isAuthenticated`. Shows a spinner while `isLoading` is true. Saves `location.pathname` to router state before redirecting to `/login`.
- **Admin** — additionally checks `user.role === 'admin'`. Non-admins redirected to `/dashboard` silently.

**Full route map:**

| Path | Component | Access |
|------|-----------|--------|
| `/` | Landing | Public |
| `/login` | Login | Public (redirect to `/dashboard` if auth) |
| `/register` | Register | Public (redirect to `/dashboard` if auth) |
| `/exams` | ExamLibrary | Public |
| `/dashboard` | Dashboard | Protected |
| `/quiz` | QuizSelect | Protected |
| `/quiz/:attemptId` | QuizActive | Protected |
| `/quiz/:attemptId/results` | QuizResults | Protected |
| `/credits` | Credits | Protected |
| `/payment-success` | PaymentSuccess | Protected |
| `/payment-fail` | PaymentFail | Protected |
| `/admin/dashboard` | AdminDashboard | Admin |
| `/admin/exams` | AdminExams | Admin |
| `/admin/questions` | AdminQuestions | Admin |
| `/admin/packs` | AdminPacks | Admin |
| `/admin/students` | AdminStudents | Admin |
| `/admin/transactions` | AdminTransactions | Admin |

**Global helpers in `App.jsx`:**
- `InsufficientCreditsHandler` — `useEffect` listening for `'insufficient-credits'` custom event → `navigate('/credits')`.
- `ChatbotWidget` — rendered at the App level (outside routes) so it's visible on all student pages without requiring re-mount on navigation.

---

## 8. Pages — Complete Reference

### Landing
Marketing page. Hero, features, Bac countdown widget (calculated client-side: days to June 10). No API calls.

### Login
Form: email + password. On success → `login(token, user)` → navigate to saved `from` path or `/dashboard`. Framer Motion entrance animation.

### Register
Form: name + email + password. Same success flow. Client-side validation matches backend rules (name 2+, email, password 8+).

### Dashboard
Calls `GET /api/dashboard` on mount. Skeleton loaders while loading. Displays:
- Bac countdown, recent attempts, chapter stats bar chart (Recharts), weakest chapters, subject progression, activity heatmap, goals overview, AI recommendations.

### ExamLibrary
Calls `GET /api/exams` on mount and on filter change. Filter bar has 4 dropdowns (Matière, Filière, Année, Type) — each uses a `<div class="relative">` wrapper with a positioned Lucide `<ChevronDown>` icon (no data-URI SVG). Skeleton loaders. PDF opens in new tab.

### QuizSelect
Calls `GET /api/subjects` on mount. Tab/section layout per subject. Each chapter card shows name + credit cost. **Error state with retry button** if the API call fails (does not show infinite skeleton). Skeleton loaders while loading.

### QuizActive
Receives questions via React Router navigation state. Questions shown one at a time with animated transitions. MCQ: radio-style buttons. Numerical: number input. Submit sends `POST /api/quiz/submit`. Result shape passed as `{ results: res }` where `res` is the full api response `{ data: { score, maxScore, percentage, breakdown } }`.

### QuizResults
**Dual-mode data loading:**
1. **Fast path (normal flow):** reads `location.state?.results?.data` passed from QuizActive.
2. **Fallback (page refresh):** if state is missing, fetches `GET /api/quiz/:attemptId/results` from the backend.

Shows skeleton loaders during fetch, error state if fetch fails. Displays score, pie chart (Recharts), and per-question breakdown. No fake XP metric.

### Credits
Calls `GET /api/credits/packs` and `GET /api/credits/history` on mount. Pack cards with Buy buttons. **All pack buttons are disabled** while any checkout is processing (`processing !== null`), preventing simultaneous checkout sessions. Skeleton loaders.

### PaymentSuccess
Calls `GET /api/auth/me` on mount → `updateCredits(res.data.creditBalance)`. Shows new balance.

### PaymentFail
No API calls. Links back to `/credits`.

### Admin Pages
All require admin role. Standard CRUD with AlertDialog confirmations on destructive actions.

---

## 9. Key Interaction Flows

### Credit purchase
1. Student clicks Buy on a pack → all pack buttons disabled.
2. `POST /api/credits/checkout` → returns `{ checkoutUrl }`.
3. `window.location.href = checkoutUrl` → Chargily hosted page.
4. Chargily redirects to `/payment-success`.
5. PaymentSuccess calls `GET /api/auth/me` → `updateCredits()` → navbar updates.

### Quiz start
1. Student clicks Start Quiz on a chapter.
2. `POST /api/quiz/start` with `chapterId`.
3. On 402 → `insufficient-credits` event → `InsufficientCreditsHandler` → navigate to `/credits`.
4. On 200 → `updateCredits(creditBalance)` → navigate to `/quiz/:attemptId` with `{ questions }` in state.

### Quiz submit
1. Student clicks Submit on QuizActive.
2. `POST /api/quiz/submit` with `{ attemptId, answers }`.
3. Navigate to `/quiz/:attemptId/results` with `{ results: res }` in state.
4. QuizResults reads `location.state.results.data` immediately (no extra fetch).

### Page refresh on QuizResults
1. `location.state` is empty (browser cleared it).
2. `useEffect` fires → `GET /api/quiz/:attemptId/results`.
3. Skeleton shown during fetch. Results displayed normally after.

### Chatbot
1. Student types message → clicks Send.
2. Input cleared, typing indicator shown.
3. `POST /api/chatbot` with `{ message }`.
4. On success → response appended to chat history, `updateCredits()` called.
5. On 402 → redirect to `/credits` via event handler.
6. On other failure → friendly error shown in chat panel (credit was refunded server-side).

---

## 10. Components

### Navbar
Shows credit balance from `AuthContext.creditBalance` (updates in real-time). Student nav: Exams, Quiz, Dashboard. Admin nav: admin panel links. Unauthenticated: Login + Register.

### ProtectedRoute
Renders spinner while `isLoading`. Redirects to `/login` (with `from` in state) when not authenticated.

### ChatbotWidget
**Rendered at App level** (not inside any specific layout) — visible on all student pages. Floating FAB with glow animation in bottom-right corner. Opens slide-up chat panel. Typing indicator while waiting for response. Manages own `messages` state (not persisted). Detects user language and responds accordingly.

### Skeleton (`src/components/ui/skeleton.jsx`)
Custom glass-shimmer animated skeleton. Used on: Dashboard, ExamLibrary, Credits, QuizSelect, QuizResults.

---

## 11. API Calls Reference

| Endpoint | Called By | Trigger |
|----------|-----------|---------|
| `POST /api/auth/register` | Register.jsx | Form submit |
| `POST /api/auth/login` | Login.jsx | Form submit |
| `GET /api/auth/me` | AuthContext | Mount (if token exists) |
| `GET /api/auth/me` | PaymentSuccess.jsx | Mount |
| `GET /api/subjects` | QuizSelect.jsx, AdminQuestions.jsx | Mount |
| `GET /api/exams` | ExamLibrary.jsx | Mount + filter change |
| `GET /api/dashboard` | Dashboard.jsx | Mount |
| `POST /api/quiz/start` | QuizSelect.jsx | Start Quiz click |
| `POST /api/quiz/submit` | QuizActive.jsx | Submit click |
| `GET /api/quiz/:id/results` | QuizResults.jsx | Mount (fallback only, when no router state) |
| `POST /api/chatbot` | ChatbotWidget.jsx | Send click |
| `GET /api/credits/packs` | Credits.jsx | Mount |
| `POST /api/credits/checkout` | Credits.jsx | Buy click |
| `GET /api/credits/history` | Credits.jsx | Mount |
| `GET /api/admin/stats` | AdminDashboard.jsx | Mount |
| `GET /api/admin/questions` | AdminQuestions.jsx | Mount + filter change |
| `POST /api/admin/exams` | AdminExams.jsx | Upload form submit |
| `DELETE /api/admin/exams/:id` | AdminExams.jsx | Delete confirm |
| `POST /api/admin/questions` | AdminQuestions.jsx | Add form submit |
| `PUT /api/admin/questions/:id` | AdminQuestions.jsx | Edit form submit |
| `DELETE /api/admin/questions/:id` | AdminQuestions.jsx | Delete confirm |
| `GET /api/admin/credit-packs` | AdminPacks.jsx | Mount |
| `POST /api/admin/credit-packs` | AdminPacks.jsx | Add form submit |
| `PUT /api/admin/credit-packs/:id` | AdminPacks.jsx | Toggle/edit |

---

## 12. UI Rules & Design Conventions

- **Loading states:** Every data-fetching page shows `Skeleton` components while loading. No blank white pages.
- **Error states:** Pages that can fail to load data show an error message with a **retry button** (not an infinite skeleton). See: QuizSelect, QuizResults.
- **Button loading:** Every button triggering an API call is disabled + shows a spinner while in-flight.
- **Double-submit prevention:** Credits page disables **all** pack buttons while any checkout is in progress.
- **Empty states:** All lists have a designed empty state with a relevant CTA.
- **Credit balance:** Always visible in the navbar. Updates in real-time via `updateCredits()` after quiz start, chatbot message, and payment success — no page reload required.
- **Admin deletes:** Always gated behind a Shadcn AlertDialog that names the specific item. Destructive button variant.
- **Filter dropdowns:** Use `<div class="relative">` wrapper + positioned Lucide `<ChevronDown>` icon with `pointer-events-none`. Never use data-URI SVG background-image for icons.
- **Select appearance:** `appearance-none` on all `<select>` elements (custom icon handles the chevron).
- **Animations:** Framer Motion for page entrances (`opacity 0→1`, `y 20→0`), list stagger (0.05–0.1s delay per item), and route transitions. Chatbot messages animate in per-message.
- **Border radius:** Standardized to `rounded-lg` / `rounded-xl` throughout. Cards use `rounded-xl` or `rounded-2xl`. Hero/feature sections use `rounded-[3rem]`.
- **Typography:** Font: Inter. Headings: `font-black`. Labels: `font-bold`. Body: `font-semibold`. Filter labels: `text-[10px] font-black uppercase tracking-widest`.
- **Colors:** Primary navy `#1e3a8a`. Accent emerald `#10b981`. Slate scale for neutrals.
- **No browser `alert()`:** All user feedback goes through Sonner toasts or inline error messages.
- **Quiz in-progress:** No correctness indicators while the quiz is active. No green/red on selection.
- **Responsive:** Minimum 375px viewport. Mobile-first layouts. Chatbot widget does not overlap form inputs on small screens.

---

## 13. Form Handling

No form library (no React Hook Form, no Formik). All forms use controlled inputs + local state.

- `onChange` → update local state object.
- `onSubmit` → `e.preventDefault()` → validate → set loading → API call → handle success/error → `finally` reset loading.
- File inputs: held as a `File` object; appended to `FormData` at submit time.
- `api()` detects `FormData` automatically and skips setting `Content-Type: application/json`.
- Backend validation errors (`400` with `details`) are displayed inline beneath the relevant fields or as toasts.

---

## 14. Error Handling Strategy

**Layer 1 — API client global interceptors (`client.js`):**
- 401 → clear auth state, throw `'Session expired'`
- 402 → dispatch `'insufficient-credits'` event → React Router navigate to `/credits`

**Layer 2 — Component try/catch:**
- Extracts `err.message` (already parsed by the client wrapper)
- Displayed as Sonner toast or inline error

**Layer 3 — Empty state handling:**
- API returns empty array → designed empty state shown (not blank space)

**Layer 4 — Page-level error state:**
- QuizSelect: shows "Erreur de Chargement" + retry button
- QuizResults: shows error message + "Retour au Dashboard" button

**What must never happen:** blank white page, silent error swallow, unhandled rejection freeze, or `alert()` call.

---

## 15. Deployment on Vercel

- Vercel root directory: `client/`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- `VITE_API_URL` set in Vercel environment variables panel → points to Render backend URL

**Required `vercel.json`** in `client/` root:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
Without this, refreshing any route other than `/` returns a 404 from Vercel.

> Cold start perception comes from Render's free tier waking up (~30s), not from Vercel (CDN, essentially instant).
