import { createClient } from '@supabase/supabase-js';

// دونوں قدریں عوامی ہیں، اسی لیے کوڈ میں رکھنا محفوظ ہے۔
// secret / service_role کی یہاں یا GitHub پر کبھی نہ لکھیں۔
const SUPABASE_URL = 'https://lxfanwizheeusndaomzh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_mQhu9bMgrb2U3vS-h67nDQ_TaVS8VB2';

export const configured = !SUPABASE_URL.startsWith('PASTE');
export const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// لاگ اِن صارف (نہ ہو تو null)
export async function currentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}
