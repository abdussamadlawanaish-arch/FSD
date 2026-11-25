import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://nwcmeueptgmahqyimfod.supabase.co';

export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_4uTCVdu5ltiUqsfYoxX4lg_tYhxumvX';

export const ACCESS_CODES = {
  INSTRUCTOR_ACCESS_CODE: 'FUSAHA-INST',
  ADMIN_ACCESS_CODE: 'FUSAHA-ADMIN',
} as const;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
