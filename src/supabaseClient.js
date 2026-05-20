import { createClient } from '@supabase/supabase-js';

// Використовуємо змінні оточення Vite (починаються з VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Помилка: Змінні оточення Supabase не завантажені! Перевірте файл .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);