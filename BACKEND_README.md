# BacPrep Hub — Backend Technical Specification

> **Audience:** This document is a complete technical handoff for an AI developer to implement the backend of BacPrep Hub from scratch. Every decision has already been made. Read every section before writing anything. This is not a summary — it is the source of truth for every piece of backend logic in this project.

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

The backend is the only layer that ever communicates with external services. The frontend never directly touches Cloudinary, Gemini, or Chargily. All of that goes through the API.

**The following business rules are non-negotiable and must be enforced at the API level, not just the frontend:**

Browsing and downloading exam PDFs is completely free. Students do not need to be logged in to see the list of available exams. However, they must be authenticated to access anything personalized — their dashboard, their quiz history, and the chatbot.

Taking a quiz costs credits. The exact credit cost is stored per chapter in the database, with a default of 5 credits per quiz. Before a quiz starts, the backend must check that the student has enough credits. If they do not, the request is rejected immediately with a 402 status. Credits are deducted at the moment the quiz starts, not when it is submitted. This is intentional — a student who starts a quiz and closes the tab has still consumed the resource.

Using the AI chatbot costs 1 credit per message. Same principle — the credit is deducted before the Gemini API is called. If the Gemini call fails after the credit has been deducted, the credit must be refunded programmatically in the same request's error handling.

Credits are purchased through Chargily Pay, an Algerian payment gateway that supports CCP and BaridiMob. Credits are only added to a student's account after Chargily confirms the payment via a webhook with a verified HMAC signature. Never add credits based on the student's own request — only based on Chargily's server-to-server webhook.

Admin accounts are never created through the API. There is no registration endpoint for admins. Admin accounts are created once via the seed script directly in the database. All admin routes are protected by both JWT authentication and a role check — passing one without the other is not sufficient.

---

## 2. Tech Stack

The runtime is Node.js version 20 LTS. The HTTP framework is Express version 4. The database is PostgreSQL version 15 or higher, accessed through Prisma ORM version 5, which handles the schema definition, migrations, and all database queries. Never write raw SQL unless absolutely necessary — the one known exception is shuffling quiz questions randomly, which requires a raw query because Prisma does not natively support ORDER BY RANDOM().

For authentication, JSON Web Tokens are used via the jsonwebtoken package. Passwords are hashed with bcryptjs. File uploads are handled by Multer combined with the multer-storage-cloudinary adapter, which streams files directly to Cloudinary without saving anything to the server disk. The Cloudinary Node SDK is used for file deletion. The Google Generative AI SDK is used for the Gemini chatbot. HTTP requests to the Chargily API are made with Axios. CORS is handled by the cors package. Security headers are added by Helmet. Rate limiting uses express-rate-limit. Request body validation uses express-validator. HTTP request logging in development uses Morgan. Nodemon is a development-only dependency for auto-restarting the server on file changes.

---

## 3. Folder Structure

The entire backend lives in a folder called server at the root of the repository. Inside server, there are two main areas: the prisma folder and the src folder.

The prisma folder contains exactly two files. The schema file is the single source of truth for every database table, column, and relationship in the entire project. The seed file is a script that populates the database with the initial data needed to run the platform — subjects, chapters, credit packs, and the admin account.

Inside src, the code is organized into six subfolders. The app file sets up the Express application — it registers all middleware and all route files but does not start the server. The server file is the actual entry point — it connects to the database and then calls app.listen. These are intentionally separate so the app can be tested without starting a real server.

The middleware folder contains five files, one per middleware function: the JWT authentication middleware, the admin role check middleware, the credit balance check middleware, the request validation formatter, and the Multer file upload configuration.

The routes folder contains one file per domain area: auth, subjects, exams, quiz, dashboard, chatbot, credits, and admin. Each file only defines the routes and their middleware chain, then delegates to a controller.

The controllers folder mirrors the routes folder exactly. Each controller file contains the actual business logic for its domain. Controllers import from services and from the Prisma client. They never contain database queries directly — those go through the Prisma client imported from the lib folder.

The services folder contains four files that wrap external integrations: the grading logic for quizzes, the Gemini API wrapper, the Chargily API wrapper, and the Cloudinary deletion helper.

The lib folder contains a single file that exports the Prisma client as a singleton. This is critically important — if multiple files instantiate PrismaClient independently, the application will exhaust its database connections in production. Every controller and service must import the client from this one shared file.

The utils folder contains a single asyncHandler utility that wraps async controller functions to automatically catch rejected promises and forward them to Express's error handler. Every route handler must be wrapped with this utility to avoid unhandled promise rejections crashing the server.

---

## 4. Environment Variables

There are fourteen environment variables. They live in a .env file in the server folder root. This file is never committed to version control. A .env.example file with the same keys but empty values is committed instead.

PORT controls which port the server listens on. NODE_ENV is either development or production and affects error message verbosity and logging.

DATABASE_URL is the full PostgreSQL connection string in the format that Prisma expects, including the username, password, host, port, database name, and schema name.

JWT_SECRET is the secret used to sign and verify all tokens. It must be at least 64 random characters. JWT_EXPIRES_IN controls how long tokens stay valid — set this to 7 days.

There are three Cloudinary variables: the cloud name, the API key, and the API secret. All three are found in the Cloudinary dashboard.

GEMINI_API_KEY is the Google AI Studio API key for accessing the Gemini model.

There are three Chargily variables: the main API key for making checkout requests, the API secret, and the webhook secret used to verify incoming webhook signatures.

FRONTEND_URL is the full URL of the React frontend, for example http://localhost:5173 in development and the Vercel URL in production. It is used in two places: the CORS configuration to restrict which origins can make requests, and the Chargily checkout creation to specify where to redirect the user after payment.

---

## 5. Database Schema

The database has nine tables. Here is every table, every column, and every relationship.

**users** stores all registered accounts regardless of role. Columns: a serial primary key id, a name string up to 100 characters, an email string up to 150 characters that must be unique across the table, a password_hash text field storing the bcrypt result, a role string defaulting to student that can also be admin, a credit_balance integer defaulting to zero, and a created_at timestamp defaulting to the current time. The users table relates one-to-many with both attempts and transactions.

**subjects** stores the two subjects on the platform. Columns: a serial primary key id and a name string up to 50 characters. The only values currently seeded are Mathématiques and Physique. Subjects relate one-to-many with both chapters and exams.

**chapters** stores the individual chapters within each subject. Columns: a serial primary key id, a subject_id foreign key referencing subjects, a name string up to 150 characters, an order_index integer to control display order, and a credit_cost integer defaulting to 5 representing how many credits a student must spend to start a quiz on this chapter. Chapters relate one-to-many with both questions and attempts.

**exams** stores the metadata for each uploaded PDF. Columns: a serial primary key id, a subject_id foreign key referencing subjects, a year integer, a stream string up to 50 characters representing the student stream such as Sciences or Mathématiques, a type string that is either exam or correction, a file_url text field containing the full Cloudinary HTTPS URL, a public_id text field containing the Cloudinary internal identifier needed for future deletion, and an uploaded_at timestamp.

**questions** stores every quiz question. Columns: a serial primary key id, a chapter_id foreign key referencing chapters, a type string that is either mcq or numerical, a content text field with the question text, an options JSON column storing an array of option strings for MCQ questions and null for numerical questions, a correct_answer text field storing the correct option text for MCQ or the correct number as a string for numerical, a tolerance float defaulting to zero defining the acceptable margin of error for numerical grading, and a points integer defaulting to 1. Questions relate one-to-many with answers.

**attempts** stores each instance of a student starting a quiz. Columns: a serial primary key id, a user_id foreign key referencing users, a chapter_id foreign key referencing chapters, a total_score integer defaulting to zero filled in after submission, a max_score integer set at attempt creation representing the sum of all question points, a credits_spent integer recording how many credits were deducted for this attempt, a started_at timestamp, and a submitted_at timestamp that is null until the student submits. Attempts relate one-to-many with answers.

**answers** stores each individual answer within an attempt. Columns: a serial primary key id, an attempt_id foreign key referencing attempts, a question_id foreign key referencing questions, a student_answer text field that may be null if the student skipped the question, an is_correct boolean, and a score integer.

**credit_packs** stores the available purchase options. Columns: a serial primary key id, a name string up to 100 characters, a credits integer representing how many credits the student receives, a price_da integer representing the price in Algerian Dinars, and an is_active boolean defaulting to true. Inactive packs are hidden from students but never deleted so transaction history remains intact.

**transactions** stores every payment attempt. Columns: a serial primary key id, a user_id foreign key referencing users, a pack_id foreign key referencing credit_packs, a chargily_id string that must be unique across the table storing the identifier returned by Chargily, an amount_da integer, a credits_added integer, a status string defaulting to pending that transitions to paid or failed, and a created_at timestamp.

---

## 6. Server Setup

The application is split across two files intentionally. The app file creates the Express instance and configures everything on it without starting it. The server file imports the app, connects to the database, and then starts listening on the configured port.

In the app file, the first thing registered after creating the Express instance is Helmet, which automatically sets secure HTTP response headers. Then CORS is configured to only allow requests from the FRONTEND_URL environment variable, never a wildcard. Then the global rate limiter is applied at 100 requests per IP per 15-minute window. Then Morgan is added for request logging but only when NODE_ENV is not production.

The next step is critical and the order must not be changed. The Chargily webhook route must be registered with a raw body parser before the global JSON body parser is applied. This is because verifying the Chargily webhook signature requires access to the exact raw bytes of the request body. Once Express's JSON parser processes a request, the raw body is gone and HMAC verification will always fail. The webhook route receives its body as a Buffer, and all other routes receive normally parsed JSON.

After the body parsers, all eight route files are mounted at their paths. Then a health check route is added at /health returning a simple status ok. Then a 404 handler catches unmatched routes. Finally, the global error handler at the very end catches anything passed to Express's next function and returns a clean JSON error response. In production it never exposes stack traces.

In the server file, the Prisma client connects to the database first. The HTTP server only starts after that connection is confirmed. If the database connection fails, the process exits immediately so the error is visible rather than starting a server that cannot serve any data.

---

## 7. Middleware

**Authentication middleware** reads the Authorization header and expects the format Bearer followed by a space and the JWT. Anything that does not match this format is rejected with 401. It verifies the token's signature and expiration using the JWT secret. If the token is structurally valid, it performs a fresh database lookup to get the full current user record. This lookup is intentional — it ensures that if a user is deleted after their token was issued, the token stops working immediately. The full user object is attached to req.user and is available to all subsequent middleware and controllers on that request.

**Admin middleware** must always come after authentication middleware because it reads from req.user. It checks whether req.user.role equals admin and returns 403 if not. It has no other logic.

**Credits middleware** is a factory function — it accepts a number and returns a middleware function. Calling requireCredits(5) returns a middleware that enforces a minimum balance of 5 credits. If req.user.creditBalance is below the required amount, it returns 402 immediately with the required amount and the student's current balance included in the response body. If the balance appears sufficient, the deduction happens atomically using a database update that includes a WHERE condition verifying the balance is still at least the required amount at the moment of the write. This prevents the race condition where two simultaneous requests both read a sufficient balance but together would drain it below zero. If the atomic update modifies zero rows, it means another concurrent request already drained the balance and the 402 is returned. On success, the number of credits spent is stored on req.creditsSpent for the controller to reference when creating the attempt record.

**Validation middleware** wraps express-validator's validationResult function. It is placed at the end of each route's validation chain. If validation errors exist, it returns 400 with a structured list of which fields failed and why. If there are no errors it calls next and the controller runs.

**Upload middleware** configures Multer to use Cloudinary as its storage backend directly. Files are never written to the server's disk at any point. The configuration sends files to the bacprephub/exams folder on Cloudinary, accepts only PDFs, enforces a 20 megabyte maximum, and generates the public_id from a timestamp combined with the sanitized original filename to avoid collisions. When a route uses this middleware, by the time the controller runs, Cloudinary has already received the file and req.file contains both the secure URL and the public_id ready to be saved to the database.

---

## 8. Authentication System

The system uses JSON Web Tokens with no server-side sessions. When a student logs in or registers, the server signs a token containing the user's id, email, and role, expiring in 7 days. The token is returned to the frontend which stores it in localStorage. On every request to a protected endpoint, the frontend sends the token in the Authorization header.

Passwords are hashed with bcrypt using 12 salt rounds before being stored. The plain password and the hash must never both exist in memory beyond the immediate comparison moment.

The passwordHash field must never appear in any API response under any circumstances. Every Prisma query returning user data must use select to explicitly list the fields to return rather than relying on accidental exclusion.

The admin account exists only because it was inserted by the seed script. There is no code path anywhere in the API that creates an admin account in response to any HTTP request. If someone asks for such an endpoint, the answer is no.

---

## 9. API Routes — Complete Reference

All successful responses wrap their payload in a data key. All error responses return an error key with a human-readable message. Validation error responses additionally include a details array listing each failed field and the reason it failed.

---

### 9.1 Auth Routes

**POST /api/auth/register** is public. It accepts a name, email, and password. The name must be between 2 and 100 characters. The email must be a valid format. The password must be at least 8 characters. The logic checks for an existing account with that email and returns 409 if one exists, hashes the password with bcrypt at 12 rounds, creates the user with role student and credit balance zero, signs a JWT, and returns the token alongside the user object. Responds 201 on success.

**POST /api/auth/login** is public. It accepts an email and password. The logic looks up the user by email. If no user exists, it returns 401 with the message "Invalid credentials" — not "email not found." This prevents email enumeration attacks. It then compares the submitted password against the stored hash. On match it signs a JWT and returns it alongside the user object including the current credit balance. The credit balance must be in the login response because the frontend displays it immediately after login without making a separate request.

**GET /api/auth/me** requires authentication. It returns the user object from req.user, which was already fetched by the authentication middleware. The frontend calls this on page load to verify that a stored token is still valid and to get the latest credit balance.

---

### 9.2 Subject and Chapter Routes

**GET /api/subjects** is public. It returns all subjects with their chapters nested inside, ordered by the chapter's order_index. Each chapter includes its credit_cost so the frontend can display how many credits a quiz costs before the student starts it.

---

### 9.3 Exam Routes

**GET /api/exams** is public. It accepts optional query parameters: subjectId, year, stream, and type. All filters are optional and combinable. Results include the subject name and are ordered newest first. The file_url in each result is a direct Cloudinary HTTPS link that the frontend opens in a new browser tab for the student to view or download.

---

### 9.4 Quiz Routes

**POST /api/quiz/start** requires authentication. The middleware chain is: verify token, then look up the chapter to get its credit_cost, then apply requireCredits with that cost. The body contains only a chapterId. After the credits middleware has deducted the credits, the controller validates that the chapter exists and has at least one question. It creates an Attempt record with max_score set to the sum of all question points and credits_spent set to the amount that was deducted. It then fetches all questions for the chapter in random order using a raw SQL query with ORDER BY RANDOM(), because Prisma does not support random ordering natively. The questions returned to the frontend must not include the correct_answer or tolerance fields — those are stripped before the response is sent. The response includes the new attemptId, the sanitized question list, and the student's updated credit balance after the deduction.

**POST /api/quiz/submit** requires authentication. The body contains the attemptId and an array of answers, where each answer has a questionId and a studentAnswer. The controller first verifies that the attempt exists and belongs to the requesting user — if the attempt is owned by a different user, return 403. Then it checks that submitted_at is null on the attempt — if it already has a value, the quiz was already submitted and the response is 400. Then it fetches all questions for that attempt's chapter including their correct answers and tolerances. It passes the questions and answers to the grading service, which returns a result for each question. All Answer records are created in a single batch insert. The attempt is updated with the total score and the current timestamp as submitted_at. These two writes happen inside a database transaction so they either both succeed or both fail. The response includes the score, the max score, the percentage, and a breakdown showing every question with the student's answer, the correct answer, and whether it was right.

---

### 9.5 Dashboard Route

**GET /api/dashboard** requires authentication. This single endpoint returns everything the dashboard page needs in one trip. It computes: the student's current credit balance, the number of days until the next Bac date (calculated as June 10 of the current year — if that date has already passed, it uses June 10 of the following year), the last 5 completed quiz attempts with subject and chapter names and percentage scores, per-chapter statistics showing the average percentage score across all attempts for each chapter the student has attempted, and the three weakest chapters defined as the lowest average percentage among chapters where the student has completed at least two attempts. The minimum of two attempts threshold prevents a single bad result from permanently labeling a chapter as weak.

---

### 9.6 Chatbot Route

**POST /api/chatbot** requires authentication followed by requireCredits(1). The body contains a single message field with a maximum length of 500 characters. The 1 credit is deducted by the middleware before the controller runs. The controller calls the Gemini service with the student's message. If the call succeeds, the response text is returned alongside the student's updated credit balance. If the Gemini API call fails for any reason, the controller must add 1 credit back to the user's account with a direct database update before returning the error to the client, because the middleware already deducted it and the student must not be charged for a failure that was not their fault.

---

### 9.7 Credits and Payment Routes

**GET /api/credits/packs** is public. It returns all credit packs where is_active is true, ordered by price ascending.

**POST /api/credits/checkout** requires authentication. The body contains a packId. The logic fetches the pack and verifies it exists and is active — return 404 if not found, 400 if inactive. It then calls the Chargily service to create a checkout session, passing the amount in Dinars, a human-readable description, a success URL and failure URL pointing to specific pages on the frontend, and a metadata object containing the userId and packId. Before returning, a Transaction record is created in the database with status pending and the chargilyId returned by Chargily. The response to the frontend contains only the checkout URL. The frontend redirects the user to that URL where they complete payment on Chargily's hosted page.

**POST /api/credits/webhook** is the most security-sensitive route in the backend. It is registered before the JSON body parser so it receives the raw request body as a Buffer. The first action is always to verify the HMAC-SHA256 signature in the request header against the raw body using the webhook secret — if the signature does not match, return 400 immediately without processing anything. If the event type in the payload is not payment.paid, return 200 immediately to acknowledge receipt without taking any action. For payment.paid events, find the transaction by chargilyId, check whether its status is already paid, and if it is, return 200 without doing anything — this handles duplicate webhook deliveries which Chargily may send. If the status is still pending, use a Prisma database transaction to atomically update the transaction status to paid and increment the user's credit balance by the credits_added amount stored on that transaction record. Always return 200 to Chargily. Returning any other status code causes Chargily to retry the webhook repeatedly.

**GET /api/credits/history** requires authentication. It returns the student's full transaction history ordered newest first, including the pack name for each entry.

---

### 9.8 Admin Routes

Every route in the admin file applies both verifyToken and requireAdmin before any route-specific logic. There are no exceptions.

**GET /api/admin/stats** returns the admin dashboard summary: total registered student count, total question count, total exam count, total revenue as the sum of amount_da across all paid transactions, and the most attempted chapter identified by counting attempt records grouped by chapter_id.

**POST /api/admin/exams** uses the upload middleware to handle a multipart form upload containing the PDF and its metadata: subjectId, year, stream, and type. Cloudinary processes the file before the controller runs. The controller validates the metadata fields, creates the Exam record using the file_url and public_id from req.file, and returns the created exam.

**DELETE /api/admin/exams/:id** finds the exam by id, deletes it from Cloudinary using the stored public_id with resource type raw, then deletes the database record. If the Cloudinary deletion fails, the database record is not deleted — both must succeed or neither should.

**POST /api/admin/questions** creates a question. Validation is conditional on type. For mcq: options must be an array of 2 to 5 strings, and correctAnswer must exactly match one of those strings. For numerical: options must not be provided, correctAnswer must be a parseable finite number string, and tolerance must be a non-negative number.

**PUT /api/admin/questions/:id** updates an existing question with the same conditional validation rules.

**DELETE /api/admin/questions/:id** checks first whether any Answer records reference this question. If answers exist, the question must not be deleted because doing so would corrupt historical attempt records. Return 409 with a clear message. Only proceed with deletion if zero answers reference this question.

**GET /api/admin/questions** returns a paginated list of questions. Accepts optional query filters for chapterId, subjectId, and type. Default page size is 20.

**GET /api/admin/credit-packs** returns all credit packs including inactive ones, since the admin manages everything.

**POST /api/admin/credit-packs** creates a new pack with name, credits, priceDa, and isActive.

**PUT /api/admin/credit-packs/:id** updates a pack. The isActive field can be toggled to hide a pack from students without deleting it.

---

## 10. Grading Logic

The grading logic lives in a dedicated service file and is never written inline in a controller. It is a pure function — it takes questions and answers as input and returns grading results as output without any database calls or side effects.

For MCQ questions, grading is an exact string comparison between the student's submitted answer and the stored correct answer. Both strings are trimmed of leading and trailing whitespace before comparison to avoid false negatives from accidental spaces. A missing or empty answer receives zero points.

For numerical questions, both the student's answer and the stored correct answer are parsed as floating-point numbers. If either cannot be parsed as a valid finite number, the answer is marked wrong immediately. If both parse successfully, the absolute difference between them is compared against the tolerance value. If the difference is less than or equal to the tolerance, the answer is correct. A tolerance of zero requires an exact match. A tolerance of 0.01 accepts anything within 0.01 of the correct value in either direction.

If a student submits more answers than there are questions in the chapter, the extra answers are ignored. If a student submits fewer answers than there are questions, the missing questions are treated as unanswered and receive zero points. The service handles both cases without throwing errors.

The submit controller uses the grading service's output to create all Answer records in a single batch operation and then sums the individual scores to update the Attempt record. Both writes happen inside a Prisma database transaction so that either both succeed or neither does.

---

## 11. Chargily Payment Integration

Chargily Pay v2 is the payment gateway. Its base API URL is https://pay.chargily.net/api/v2. All requests use the API key in a Bearer Authorization header.

To create a checkout session, the backend sends a POST to the Chargily checkouts endpoint containing the amount in Algerian Dinars, the currency set to dzd, the payment method set to edahabia which covers both Edahabia cards and BaridiMob, a human-readable description, a success URL, a failure URL, and a metadata object containing the userId and packId. These metadata values are critical — they are what Chargily sends back in the webhook payload and are the only reliable way to know which user made which payment when the webhook arrives. Chargily responds with a checkout URL to redirect the student to and a unique checkout ID.

The webhook is Chargily's server-to-server notification that a payment was completed. It arrives as a POST request to the backend's webhook endpoint. The request body is a JSON payload and the request includes a signature header containing an HMAC-SHA256 hash of the raw request body computed using the webhook secret.

To verify the signature, the server recomputes its own HMAC-SHA256 over the exact raw bytes of the request body using the same webhook secret. It then compares the computed value against the incoming header using a timing-safe byte comparison. Regular string comparison is not acceptable here — it can leak information about the signature through measurable timing differences, making it exploitable. If the signatures do not match, the request is rejected with 400 and no further processing occurs.

The webhook must handle duplicate deliveries gracefully. Chargily guarantees at-least-once delivery, not exactly-once. If the server returns anything other than 200, Chargily will retry the webhook. The idempotency check — verifying that the transaction status is not already paid before processing — ensures that crediting a user twice for one payment is impossible even if the webhook arrives multiple times.

---

## 12. Gemini AI Integration

The model used is gemini-1.5-flash from the Google Generative AI SDK. This model is chosen for its speed and free tier availability.

The system prompt is the most important part of the integration. It is passed as the systemInstruction parameter when the model is initialized, not as a user message. This distinction matters because it prevents students from overriding the assistant's behavior through their own messages. The prompt instructs Gemini to respond only to Maths and Physics questions at the Algerian Terminale curriculum level, to politely decline anything outside these two subjects without explaining how to bypass the restriction, to provide hints rather than direct answers when the student appears to be working through an exercise, to detect the student's language and respond in either French or Arabic accordingly, and to maintain an encouraging and age-appropriate tone throughout.

Every chatbot request creates a fresh model instance. There is no conversation history maintained across separate requests — each message is treated independently. This is a deliberate simplification appropriate for the scope of this project.

If the Gemini API call fails for any reason after the credit has already been deducted, the controller must add 1 credit back to the user's account with a direct database update before propagating the error. The student must never be charged for a system failure outside their control.

---

## 13. Cloudinary Integration

Cloudinary stores all PDF exam files. The configuration is applied once and shared across the upload middleware and the deletion service.

Every Cloudinary operation on PDF files must use resource type raw. This applies to uploads, deletions, and any URL generation. Using auto or image will either fail or produce URLs that browsers cannot open as documents. This is a common mistake that must be avoided explicitly.

When a file is uploaded, Cloudinary returns two values that must both be saved to the database. The secure_url is the full HTTPS link used when a student clicks to view an exam. The public_id is Cloudinary's internal identifier used when an admin deletes an exam. Without the public_id stored in the database, it becomes impossible to clean up files from Cloudinary storage.

When deleting a file, the public_id is retrieved from the database record and passed to Cloudinary's destroy method with resource type explicitly set to raw. The Cloudinary deletion must succeed before the database record is removed. If Cloudinary deletion fails, the database record stays so the file reference remains intact.

---

## 14. Error Handling Strategy

Every async route handler must be wrapped in the asyncHandler utility. This utility catches rejected promises and forwards them to Express's next function, which routes them to the global error handler. Without this wrapper, unhandled rejections in async functions cause requests to hang indefinitely with no response sent to the client.

The global error handler is the last piece of middleware registered in app.js. It receives any error passed to next, reads the status property from the error object if present or defaults to 500, and returns a JSON response with the error message. In production the stack trace is never included. In development it may be logged to the console.

Prisma-specific errors should be caught before reaching the global handler and translated into meaningful HTTP responses. A unique constraint violation indicates a duplicate entry and should become a 409. A record not found error should become a 404. Any other Prisma error should be treated as a 500.

The HTTP status codes used across the entire API are: 200 for successful operations, 201 for resource creation, 400 for validation errors and already-submitted quizzes, 401 for missing or invalid authentication tokens, 402 for insufficient credits, 403 for valid token but insufficient role, 404 for resources not found, 409 for conflicts such as duplicate emails or questions with existing answers, and 500 for unexpected server errors.

---

## 15. Security Checklist

The passwordHash column must never appear in any API response. Use Prisma's select option to explicitly list the fields to return on every user query.

The JWT secret must be at least 64 characters of random data. A short or guessable secret makes the entire authentication system vulnerable.

CORS must be restricted to the FRONTEND_URL environment variable. A wildcard CORS configuration would allow any website to make authenticated requests to the API on behalf of logged-in students.

The Chargily webhook endpoint must verify the HMAC signature using a timing-safe comparison on every single request before any other processing takes place. A webhook without signature verification means any attacker knowing the endpoint URL can credit any account with unlimited credits by sending a fake POST request.

The webhook route must use the raw body parser and must be registered before the JSON body parser in app.js. If this order is wrong, HMAC verification will always fail in production.

The webhook handler must be idempotent. Chargily sends webhooks at least once, not exactly once.

Credit deduction must use an atomic database update with a WHERE condition on the current balance. A naive read-then-write approach is a race condition vulnerability.

Quiz submission must verify that the attempt belongs to the requesting user. Without this check, a student could submit answers into another student's ongoing quiz attempt.

File uploads are restricted to PDF MIME type and 20 megabytes maximum in the Multer configuration.

Admin routes must apply both verifyToken and requireAdmin. One without the other is insufficient.

The .env file must be in .gitignore and must never appear in any commit.

---

## 16. Deployment on Render

The backend is deployed as a Web Service on Render. The repository contains both the React frontend and the Node.js backend. When configuring the Render service, the root directory must be set to the server subfolder so Render only processes the backend code.

The build command must do three things in sequence: install npm dependencies, generate the Prisma client from the schema file, and run database migrations using the deploy flag rather than the dev flag. The deploy flag applies pending migrations without interactive prompts and without creating new migration files — it is the correct command for production. The dev flag must never run in a production environment.

The start command is simply node src/server.js.

All environment variables from the .env file must be entered manually in Render's environment settings panel. The DATABASE_URL must use the internal connection string provided by Render's PostgreSQL service, not the external one, to avoid unnecessary latency and to stay within the free tier connection limits.

Render's free tier pauses web services after 15 minutes of inactivity. The first request after a pause triggers a cold start that takes approximately 30 seconds. This is acceptable for a PFE demo environment and does not need to be solved.

---

## 17. Seed Data

The seed script runs once against a fresh database to insert all foundational data. It uses upsert operations throughout so running it multiple times is safe and produces no duplicates.

It creates one admin account with email admin@bacprephub.dz, a securely hashed password, the role admin, and a credit balance of 9999 so the admin can test all credit-gated features without buying credits.

It creates two subjects: Mathématiques and Physique.

It creates ten chapters for Mathématiques in this order: Suites numériques, Limites et continuité, Dérivation, Étude de fonctions, Calcul intégral, Équations différentielles, Nombres complexes, Probabilités, Géométrie dans l'espace, and Statistiques. Each chapter gets a credit cost of 5.

It creates nine chapters for Physique in this order: Mécanique — Cinématique, Mécanique — Dynamique, Mécanique — Travail et Énergie, Électricité — Circuits RC et RL, Électricité — Oscillations, Optique géométrique, Ondes mécaniques, Radioactivité et noyau, and Spectroscopie. Each chapter also gets a credit cost of 5.

It creates four credit packs: Pack Débutant at 300 DA for 50 credits, Pack Standard at 600 DA for 120 credits, Pack Premium at 1200 DA for 300 credits, and Pack Révision at 2000 DA for 600 credits. All four are active from the start.

The seed script is registered in package.json under the prisma.seed key so it can be invoked with the command npx prisma db seed after running migrations.
