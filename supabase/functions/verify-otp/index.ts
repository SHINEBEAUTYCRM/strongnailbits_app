// Supabase Edge Function: verify-otp (SECURED)
// - Brute-force protection: max 5 attempts per phone per 15 min
// - Rate limit per IP: 10 requests per 15 min
// - Input validation
// - No internal errors leaked to client

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = Deno.env.get('SITE_URL') || '';
const ALLOWED_ORIGINS = [SITE_URL, SITE_URL.replace('https://', 'https://www.')].filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// Rate limiting: per IP and per phone
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_IP_ATTEMPTS = 10;
const MAX_PHONE_ATTEMPTS = 5;
const ipAttempts = new Map<string, number[]>();
const phoneAttempts = new Map<string, number[]>();

function isRateLimited(map: Map<string, number[]>, key: string, max: number): boolean {
  const now = Date.now();
  const timestamps = (map.get(key) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= max) return true;
  timestamps.push(now);
  map.set(key, timestamps);
  return false;
}

// Normalize phone to 380XXXXXXXXX format (identical to website logic)
function normalizePhone(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 9) return '380' + digits;
  if (digits.length === 10 && digits.startsWith('0')) return '38' + digits;
  if (digits.length === 11 && digits.startsWith('80')) return '3' + digits;
  if (digits.length === 12 && digits.startsWith('380')) return digits;
  return null;
}

function phoneVariants(normalized: string): string[] {
  const nineDigits = normalized.slice(3);
  return [normalized, '0' + nineDigits, nineDigits, '+' + normalized];
}

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  try {
    // Rate limit by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (isRateLimited(ipAttempts, clientIp, MAX_IP_ATTEMPTS)) {
      return new Response(
        JSON.stringify({ error: 'Забагато спроб. Зачекайте 15 хвилин.' }),
        { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { phone, code } = body;

    // === VALIDATE & NORMALIZE phone ===
    const normalized = normalizePhone(phone);
    if (!normalized) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Невірний номер телефону' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // === VALIDATE code ===
    if (!code || typeof code !== 'string' || !/^[0-9]{4,6}$/.test(code)) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Невірний код' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit by phone (brute-force protection)
    if (isRateLimited(phoneAttempts, normalized, MAX_PHONE_ATTEMPTS)) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Забагато спроб для цього номера. Зачекайте 15 хвилин.' }),
        { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // === FIND valid OTP ===
    const { data: otpRecord } = await supabase
      .from('otp_codes')
      .select('id, attempts')
      .eq('phone', normalized)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!otpRecord) {
      // Increment attempts on all active codes for this phone
      const { data: activeCodes } = await supabase
        .from('otp_codes')
        .select('id, attempts')
        .eq('phone', normalized)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString());

      if (activeCodes) {
        for (const c of activeCodes) {
          const newAttempts = (c.attempts ?? 0) + 1;
          if (newAttempts >= 5) {
            // Auto-invalidate after 5 wrong attempts
            await supabase.from('otp_codes').update({ used: true }).eq('id', c.id);
          } else {
            await supabase.from('otp_codes').update({ attempts: newAttempts }).eq('id', c.id);
          }
        }
      }

      return new Response(
        JSON.stringify({ verified: false, error: 'Невірний або прострочений код' }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Mark as used
    await supabase.from('otp_codes').update({ used: true }).eq('id', otpRecord.id);

    // Check if user exists (search by all phone variants)
    const variants = phoneVariants(normalized);
    const orFilter = variants.map(v => `phone.eq.${v}`).join(',');
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .or(orFilter)
      .limit(1)
      .maybeSingle();

    if (!profile) {
      return new Response(
        JSON.stringify({ verified: true, existingUser: false, hasAuth: false, profile: null, loginEmail: null }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Check if auth user exists for this profile
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
    const hasAuth = !!authUser?.user;
    const resolvedEmail = profile.email || authUser?.user?.email || null;

    return new Response(
      JSON.stringify({
        verified: true,
        existingUser: true,
        hasAuth,
        profile: { id: profile.id, firstName: profile.first_name, lastName: profile.last_name },
        loginEmail: resolvedEmail,
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('verify-otp error:', error);
    return new Response(
      JSON.stringify({ verified: false, error: 'Помилка верифікації. Спробуйте ще раз.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
