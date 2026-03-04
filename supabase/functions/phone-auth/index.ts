// Supabase Edge Function: phone-auth (SECURED)
// Actions: register, get-login-email
// - Normalizes Ukrainian phone numbers (matches website logic)
// - Searches profiles by all phone format variants (380XXX, 0XXX, XXX, +380XXX)
// - Links existing 1C/website profiles to new auth accounts
// - Rate limiting per IP
// - XSS protection on all text fields

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = ['https://shineshopb2b.com', 'https://www.shineshopb2b.com'];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 10;
const ipRateMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipRateMap.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) return true;
  timestamps.push(now);
  ipRateMap.set(ip, timestamps);
  return false;
}

function sanitizeText(input: string, maxLen = 100): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLen);
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

// All phone format variants for DB search (1C, website, mobile may store differently)
function phoneVariants(normalized: string): string[] {
  const nineDigits = normalized.slice(3);
  return [normalized, '0' + nineDigits, nineDigits, '+' + normalized];
}

const VALID_ACTIONS = ['register', 'get-login-email'];

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Забагато запитів. Зачекайте.' }),
        { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Невідома дія' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const normalized = normalizePhone(body.phone);
    if (!normalized) {
      return new Response(
        JSON.stringify({ error: 'Невірний номер телефону' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const variants = phoneVariants(normalized);
    const orFilter = variants.map(v => `phone.eq.${v}`).join(',');

    switch (action) {
      case 'register': {
        const { firstName, lastName, company, password } = body;

        if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 1) {
          return new Response(JSON.stringify({ error: "Вкажіть ім'я" }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
        }
        if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 1) {
          return new Response(JSON.stringify({ error: 'Вкажіть прізвище' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
        }

        const safeFirstName = sanitizeText(firstName, 100);
        const safeLastName = sanitizeText(lastName, 100);
        const safeCompany = company ? sanitizeText(String(company), 200) : null;

        if (!password || typeof password !== 'string') {
          return new Response(JSON.stringify({ error: 'Вкажіть пароль' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
        }
        if (password.length < 6) {
          return new Response(JSON.stringify({ error: 'Пароль повинен містити мінімум 6 символів' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
        }
        if (password.length > 128) {
          return new Response(JSON.stringify({ error: 'Пароль занадто довгий' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
        }

        const loginEmail = `${normalized}@phone.shineshop.local`;

        // Search profile by ALL phone format variants
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, company, external_id')
          .or(orFilter)
          .limit(1)
          .maybeSingle();

        if (existingProfile) {
          const { data: existingAuthUser } = await supabase.auth.admin.getUserById(existingProfile.id);

          if (existingAuthUser?.user) {
            // === Scenario A: profile + auth both exist ===
            const resolvedEmail = existingProfile.email || existingAuthUser.user.email;
            return new Response(
              JSON.stringify({ exists: true, loginEmail: resolvedEmail }),
              { headers: { ...cors, 'Content-Type': 'application/json' } }
            );
          }

          // === Scenario B: profile from 1C/website, no auth user ===
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            id: existingProfile.id,
            email: loginEmail,
            password,
            email_confirm: true,
          });

          if (authError) {
            console.error('Auth create error (link existing):', authError);
            return new Response(
              JSON.stringify({ error: 'Помилка реєстрації. Спробуйте ще раз.' }),
              { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
            );
          }

          // Only update email — do NOT overwrite first_name, last_name, company, external_id
          if (!existingProfile.email) {
            await supabase.from('profiles').update({ email: loginEmail }).eq('id', existingProfile.id);
          }

          return new Response(
            JSON.stringify({ success: true, claimed: true, loginEmail, userId: authUser.user.id }),
            { headers: { ...cors, 'Content-Type': 'application/json' } }
          );
        }

        // === Scenario C: brand new client ===
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: loginEmail,
          password,
          email_confirm: true,
        });

        if (authError) {
          console.error('Auth create error:', authError);
          return new Response(
            JSON.stringify({ error: 'Помилка реєстрації. Спробуйте ще раз.' }),
            { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
          );
        }

        await supabase.from('profiles').upsert({
          id: authUser.user.id,
          phone: normalized,
          first_name: safeFirstName,
          last_name: safeLastName,
          company: safeCompany,
          email: loginEmail,
        });

        return new Response(
          JSON.stringify({ success: true, claimed: false, loginEmail, userId: authUser.user.id }),
          { headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-login-email': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email')
          .or(orFilter)
          .limit(1)
          .maybeSingle();

        if (!profile) {
          return new Response(
            JSON.stringify({ loginEmail: null }),
            { headers: { ...cors, 'Content-Type': 'application/json' } }
          );
        }

        if (profile.email) {
          return new Response(
            JSON.stringify({ loginEmail: profile.email }),
            { headers: { ...cors, 'Content-Type': 'application/json' } }
          );
        }

        // Fallback for old mobile users with @shineshopb2b.com in auth.users
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
        return new Response(
          JSON.stringify({ loginEmail: authUser?.user?.email ?? null }),
          { headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Невідома дія' }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('phone-auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Помилка авторизації. Спробуйте ще раз.' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
