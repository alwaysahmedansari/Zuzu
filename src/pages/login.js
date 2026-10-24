import { supabase, currentUser } from '../supabase.js';

const MSG = [
  [/invalid login/i, 'ای میل یا پاس ورڈ درست نہیں۔'],
  [/already registered|already exists/i, 'یہ ای میل پہلے سے رجسٹر ہے۔ داخل ہوں۔'],
  [/password/i, 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔'],
  [/valid email|invalid.*email/i, 'ای میل درست نہیں۔'],
  [/rate limit|too many/i, 'بہت زیادہ کوششیں ہو گئیں۔ کچھ دیر بعد دوبارہ کریں۔'],
  [/database error/i, 'تخلص 2 سے 40 حروف کا ہونا چاہیے۔'],
];
const explain = (m = '') => (MSG.find(([re]) => re.test(m)) || [0, 'کچھ گڑبڑ ہو گئی۔ انٹرنیٹ دیکھ کر دوبارہ کوشش کریں۔'])[1];

export async function login(root) {
  if (await currentUser()) {
    location.hash = '#/author/me';
    return;
  }
  let signup = false;

  function draw() {
    root.innerHTML = `
<a class="back" href="#/">واپس</a>
<h1 class="page-title">${signup ? 'نیا اکاؤنٹ' : 'داخل ہوں'}</h1>
<form id="f" class="form" novalidate>
  ${signup ? '<label>تخلص (جو نام لوگ دیکھیں گے)<input name="pen" maxlength="40" autocomplete="nickname"></label>' : ''}
  <label>ای میل<input name="email" type="email" dir="ltr" autocomplete="email"></label>
  <label>پاس ورڈ<input name="pw" type="password" dir="ltr" autocomplete="${signup ? 'new-password' : 'current-password'}"></label>
  <p id="err" class="err" role="alert" hidden></p>
  <button class="btn" type="submit">${signup ? 'اکاؤنٹ بنائیں' : 'داخل ہوں'}</button>
</form>
<button class="link" id="sw">${signup ? 'پہلے سے اکاؤنٹ ہے؟ داخل ہوں' : 'نیا اکاؤنٹ بنائیں'}</button>`;
    root.querySelector('#sw').onclick = () => {
      signup = !signup;
      draw();
    };
    root.querySelector('#f').onsubmit = submit;
  }

  async function submit(e) {
    e.preventDefault();
    const f = e.target;
    const err = f.querySelector('#err');
    const btn = f.querySelector('.btn');
    const show = (m) => {
      err.textContent = m;
      err.hidden = false;
    };
    const email = f.email.value.trim();
    const password = f.pw.value;
    const pen = f.pen ? f.pen.value.trim() : '';
    err.hidden = true;
    if (!email || !password) return show('ای میل اور پاس ورڈ لکھیں۔');
    if (signup && (pen.length < 2 || pen.length > 40)) return show('تخلص 2 سے 40 حروف کا ہونا چاہیے۔');

    btn.disabled = true;
    let data;
    let error;
    try {
      ({ data, error } = signup
        ? await supabase.auth.signUp({ email, password, options: { data: { pen_name: pen } } })
        : await supabase.auth.signInWithPassword({ email, password }));
    } catch (err) {
      console.error('[Supabase] Authentication request failed', err);
      btn.disabled = false;
      return show('سروس سے رابطہ نہیں ہو سکا۔ انٹرنیٹ دیکھ کر دوبارہ کوشش کریں۔');
    }
    btn.disabled = false;

    if (error) return show(explain(error.message));
    if (!data.session) return show('اکاؤنٹ بن گیا۔ ای میل میں بھیجا گیا لنک کھولیں، پھر داخل ہوں۔');

    const next = sessionStorage.getItem('next') || '#/';
    sessionStorage.removeItem('next');
    location.hash = next;
  }

  draw();
}
