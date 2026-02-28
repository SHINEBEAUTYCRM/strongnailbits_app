import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const STATUS_MSG: Record<string, { title: string; body: string }> = {
  processing: {
    title: 'Замовлення обробляється ⚙️',
    body: 'Ваше замовлення #{order} взято в обробку',
  },
  shipped: {
    title: 'Замовлення відправлено! 🚚',
    body: 'Замовлення #{order} відправлено{ttn}',
  },
  delivered: {
    title: 'Замовлення доставлено! ✅',
    body: 'Замовлення #{order} доставлено. Дякуємо за покупку!',
  },
  cancelled: {
    title: 'Замовлення скасовано ❌',
    body: 'Замовлення #{order} було скасовано',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { order_id, new_status, ttn } = await req.json();
    if (!order_id || !new_status) {
      return new Response(JSON.stringify({ error: 'order_id and new_status required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: order } = await supabase
      .from('orders')
      .select('profile_id, order_number')
      .eq('id', order_id)
      .single();

    if (!order?.profile_id) {
      return new Response(JSON.stringify({ ok: true, notified: 0, reason: 'guest or not found' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const msg = STATUS_MSG[new_status];
    if (!msg) {
      return new Response(JSON.stringify({ ok: false, reason: 'unknown status' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const ttnSuffix = ttn ? `. ТТН: ${ttn}` : '';
    const title = msg.title;
    const body = msg.body.replace('{order}', order.order_number).replace('{ttn}', ttnSuffix);

    await supabase.from('notifications_feed').insert({
      profile_id: order.profile_id,
      type: 'order',
      title,
      body,
      link: '/account/orders',
      metadata: { order_id, order_number: order.order_number, status: new_status, ttn: ttn || null },
    });

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('profile_id', order.profile_id)
      .eq('is_active', true);

    let pushSent = 0;
    if (tokens?.length) {
      const messages = tokens.map(t => ({
        to: t.token,
        title,
        body,
        data: { type: 'order_status', order_id, status: new_status, ttn: ttn || null },
        sound: 'default',
        badge: 1,
      }));

      try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messages),
        });
        if (res.ok) pushSent = messages.length;
      } catch (e) { console.error('Push error:', e); }
    }

    return new Response(JSON.stringify({ ok: true, notified: pushSent }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('notify-order-status error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
