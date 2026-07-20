# SCTS Backend (MVP)

A simple TypeScript + Express + Mongoose backend for the Student Complaint Tracking System.

Quick start:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

APIs available under `/api/v1`
- `POST /api/v1/auth/admin/register`
- `POST /api/v1/auth/admin/login`
- `POST /api/v1/students/upload/analyze` (admin, multipart file `file`) — AI-assisted bulk import, see below
- `POST /api/v1/students/upload/confirm` (admin)
- `POST /api/v1/students/add` (admin)
- `POST /api/v1/students/verify` (student verification)
- `POST /api/v1/complaints` (student token)
- `GET /api/v1/complaints/track/:complaintId` (public)
- `GET /api/v1/complaints/admin` (admin)
- `PATCH /api/v1/complaints/admin/:complaintId/status` (admin)

### Email OTP verification (registration + password reset)

OTPs are 6 digits, bcrypt-hashed at rest, expire after 5 minutes, allow 5 verify
attempts and 5 resends (30s cooldown between sends). Delivered via SendGrid when
`SENDGRID_API_KEY` is set; otherwise logged to the server console and returned as
`data.debugOtp` in the API response for local development.

- `POST /api/v1/auth/admin/register-request` `{ orgName, address, email, phone, orgCode, state, district, orgType, password }` — creates/updates the pending registration and emails an OTP.
- `POST /api/v1/auth/admin/register-request/resend` `{ email }` — resends the registration OTP (respects cooldown/max-resend).
- `POST /api/v1/auth/admin/verify-otp` `{ email, otp }` — verifies the registration OTP.
- `POST /api/v1/auth/admin/forgot-password` `{ email }` — always returns success (does not leak whether the email is registered); emails an OTP if it is.
- `POST /api/v1/auth/admin/forgot-password/verify-otp` `{ email, otp }` — verifies the reset OTP and returns a `resetToken` (JWT, 10 min TTL).
- `POST /api/v1/auth/admin/forgot-password/reset` `{ resetToken, newPassword }` — sets the new password.

### Razorpay (school subscription payments)

Payment is for the school's admin subscription plan during signup (`/plans`) —
not per-complaint. Flow: `register-request` → `verify-otp` → `/payments/razorpay/order`
→ Razorpay checkout → `/payments/razorpay/confirm` (verifies the HMAC signature
server-side, then creates the `School` + `Admin` and returns a login token).

- `POST /api/v1/payments/razorpay/order` `{ email, planId }` — creates a Razorpay order for a verified pending registration.
- `POST /api/v1/payments/razorpay/confirm` `{ email, razorpay_payment_id, razorpay_order_id, razorpay_signature }` — verifies payment and creates the account. Idempotent: calling it again for an already-confirmed registration just re-issues a token instead of erroring.

Without `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` set, orders are simulated
(`demoMode: true` in the response) and no real charge happens — useful for
testing the signup flow without live payment credentials. Set both keys in
`.env` to go live, and set `admin/.env`'s `VITE_RAZORPAY_KEY_ID` to the same
key ID (never the secret) so the frontend checkout widget can open.

### AI-assisted bulk student import

Two-step flow so nothing is written to the DB until the admin confirms the
column mapping:

1. `POST /api/v1/students/upload/analyze` `multipart/form-data`, field `file`
   (`.csv` or `.xlsx`, 10MB max). Parses the file, and asks a locally-running
   LLM which column is which for four fields: `fullName`, `admissionNumber`,
   `dob`, `contactNumber`. Returns
   `{ importId, headers, sampleRows, totalRows, suggestedMapping, aiUsed, aiNote }`
   — nothing is imported yet, and the parsed rows are held server-side in
   memory keyed by `importId` for 20 minutes.
2. `POST /api/v1/students/upload/confirm` `{ importId, mapping }` where
   `mapping` is `{ fullName: <column index>, admissionNumber: <index>, dob:
   <index>, contactNumber: <index|null> }` — the admin's confirmed (or
   corrected) mapping. Cleans, validates, dedupes and imports using exactly
   that mapping, then discards the session. Calling confirm twice with the
   same `importId` fails with 410 (already consumed).

The AI step calls out to a local model server with an OpenAI-compatible chat
API — **Ollama** (`http://localhost:11434/v1`, the default) or **LM Studio**
(`http://localhost:1234/v1`) both work, no cloud API key needed. Point it at
whichever you run via `LOCAL_LLM_BASE_URL` / `LOCAL_LLM_MODEL` in `.env`; small
models are enough for this task (`qwen3:4b`/`8b`, `gemma3`, `llama3.2`,
`phi4-mini`, ...). If that server isn't reachable (not installed, not running,
model not pulled, 15s timeout), step 1 silently falls back to rule-based
alias/substring matching instead (`aiUsed: false`, `aiNote` explains why) —
the two-step confirm flow still works identically either way, the fallback is
just less forgiving of very unusual header names.

Rows missing a required field or with an unparseable DOB are skipped and
reported in `data.errors`. Dates are parsed as `DD-MM-YYYY`/`DD/MM/YYYY` or
ISO `YYYY-MM-DD` (plain `Date` parsing silently mishandles day-first dates).
Duplicate admission numbers are skipped rather than overwriting the existing
student — both duplicates already registered for the school and repeats
within the same file (only the first occurrence in the file is kept).

### Physical damage photos (complaint submission)

`POST /api/v1/complaints` accepts `multipart/form-data` (backward compatible —
multer no-ops on plain JSON requests, so existing callers without files still
work). Text fields: `title, description, category, priority, hasPhysicalDamage,
damageDescription, estimatedCost, damageLocation`. Up to 5 images under the
`images` field (JPG/PNG/WEBP, 5MB max each).

Only `secureUrl` + `publicId` are ever stored in Mongo — never the raw image
bytes. Uploads go to Cloudinary when `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
and `CLOUDINARY_API_SECRET` are set; otherwise they're saved to this server's
own `uploads/complaints/` folder and served back from `PUBLIC_BASE_URL/uploads/...`
so the feature works end-to-end before you have Cloudinary credentials.

Notes:
- Set `JWT_SECRET` in `.env` for production
- Set `SENDGRID_API_KEY`, `SENDGRID_FROM`, `SUPPORT_EMAIL`, `BRAND_NAME` to send real OTP emails
- Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` to accept real subscription payments
- Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to store damage photos in Cloudinary instead of local disk
- MongoDB required
- This is an MVP; add logging, tests, and Docker as needed
