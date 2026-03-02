# Supabase Edge Functions

**Source of truth**: `shineshop.b2b.com.ua/supabase/functions/`

Edge Functions managed centrally in the web project.
Do NOT edit functions here — make changes in the web project and copy if needed.

## Functions:
- `create-order` — Order creation with price/stock verification
- `notify-order-status` — Push + Telegram notifications on order status change
- `phone-auth` — Phone-based registration and login email lookup
- `register-push` — Register Expo push tokens
- `search` — Product and brand search
- `send-otp` — Generate and send SMS OTP codes
- `send-push` — Internal push notification sender
- `verify-otp` — OTP code verification
