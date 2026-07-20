# EduAdmin Pro - Admin App (MVP)

This is the Admin portal UI for the Student Complaint Tracking System.

Quick start:

```bash
cd admin
npm install
npm run dev
```

The app uses Tailwind CSS for layout and styling and now includes:

- `login` with email, password, and captcha check
- `signup` with organization details
- `verify-otp` for email verification
- `plans` with test Razorpay checkout flow
- protected dashboard routes for logged-in admins

Environment variables:

- `VITE_API_BASE_URL` defaulting to `http://localhost:4000/api/v1`
- `VITE_RAZORPAY_KEY_ID` for live/test Razorpay checkout when configured

Demo mode works without keys, using OTP and payment fallbacks from the backend.
