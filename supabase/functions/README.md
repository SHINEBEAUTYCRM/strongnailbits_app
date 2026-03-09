# Supabase Edge Functions

Edge Functions for the Strong Nail Bits mobile app.

## Functions:
- `create-order` — Order creation with price/stock verification
- `notify-order-status` — Push notifications on order status change
- `phone-auth` — Phone-based registration and login email lookup
- `register-push` — Register Expo push tokens
- `search` — Product and brand search
- `send-otp` — Generate and send SMS OTP codes
- `send-push` — Internal push notification sender
- `verify-otp` — OTP code verification

## Environment Variables (set in Supabase dashboard):
- `SITE_URL` — Your production site URL (used for CORS)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key
