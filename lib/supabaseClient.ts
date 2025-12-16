import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bhttohdroufvproiqqyn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mSF6JbzhzAIlN4wPktiySA_uaiSM8g-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);