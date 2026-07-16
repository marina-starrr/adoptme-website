// Supabase Edge Function: admin-users
// ----------------------------------------------------------------------------
// Адмін-операції, що потребують service_role (створення користувача, скидання
// паролю). service_role-ключ доступний ЛИШЕ тут, на сервері — ніколи у фронтенді.
//
// Викликач мусить бути автентифікованим адміном: перевіряємо його JWT і роль у
// profiles. Дії: { action: 'create' | 'set_password', ... }.
//
// ДЕПЛОЙ:  supabase functions deploy admin-users
// Змінні SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
// підставляються платформою автоматично.
// ----------------------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Не авторизовано' }, 401);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Клієнт від імені викликача — щоб дізнатися, хто робить запит
    const callerClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) return json({ error: 'Сесія недійсна' }, 401);

    // Адмін-клієнт із service_role — обходить RLS
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Перевіряємо, що викликач — адміністратор
    const { data: callerProfile } = await admin
      .from('profiles').select('role').eq('id', user.id).single();
    if (callerProfile?.role !== 'admin') {
      return json({ error: 'Доступ лише для адміністратора' }, 403);
    }

    const body = await req.json();
    const { action } = body;

    // --- Створення нового користувача ---
    if (action === 'create') {
      const nickname = (body.nickname ?? '').trim();
      const email = (body.email ?? '').trim();
      const password = body.password ?? '';
      const phone = (body.phone ?? '').replace(/\D/g, '');
      const role = body.role === 'admin' ? 'admin' : 'user';

      if (!nickname || !email || password.length < 6) {
        return json({ error: 'Некоректні дані (нікнейм, email, пароль ≥ 6 символів)' }, 400);
      }

      const { data: available } = await admin.rpc('nickname_available', { p_nickname: nickname });
      if (available === false) {
        return json({ error: 'Цей нікнейм вже зайнятий' }, 409);
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // адмін створює вже підтверджений акаунт
        user_metadata: {
          nickname,
          first_name: (body.first_name ?? '').trim(),
          last_name: (body.last_name ?? '').trim(),
          phone,
        },
      });
      if (createError) return json({ error: createError.message }, 400);

      // Тригер створює профіль із роллю 'user'; за потреби підвищуємо
      if (role === 'admin' && created.user) {
        await admin.from('profiles').update({ role: 'admin' }).eq('id', created.user.id);
      }

      return json({ ok: true, id: created.user?.id });
    }

    // --- Скидання паролю користувача ---
    if (action === 'set_password') {
      const userId = body.userId;
      const password = body.password ?? '';
      if (!userId || password.length < 6) {
        return json({ error: 'Некоректні дані (userId, пароль ≥ 6 символів)' }, 400);
      }
      const { error: updError } = await admin.auth.admin.updateUserById(userId, { password });
      if (updError) return json({ error: updError.message }, 400);
      return json({ ok: true });
    }

    return json({ error: 'Невідома дія' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
