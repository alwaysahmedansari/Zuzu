import { supabase, currentUser } from '../supabase.js';
import { KINDS, esc, urduNum, readMinutes, resizeImage, extOf, showLoadError } from '../utils.js';

const DRAFT = 'zuzu-draft';
const NOT_FOUND = '<p class="empty">یہ تحریر نہیں ملی۔<br><a class="tab on" href="#/">ہوم پر واپس</a></p>';

export async function write(root, editId) {
  const user = await currentUser();
  if (!user) {
    sessionStorage.setItem('next', location.hash || '#/write');
    location.hash = '#/login';
    return;
  }

  let post = { kind: 'column', title: '', subtitle: '', body: '', cover_url: null, thumb_url: null };
  if (editId) {
    const { data, error } = await supabase.from('posts').select('*').eq('id', editId).eq('author_id', user.id).maybeSingle();
    if (error) {
      console.error('[Supabase] Post edit lookup failed', error);
      showLoadError(root, 'تحریر ترمیم کے لیے لوڈ نہیں ہو سکی۔ دوبارہ کوشش کریں۔', () => write(root, editId));
      return;
    }
    if (!data) {
      root.innerHTML = NOT_FOUND;
      return;
    }
    post = data;
  } else {
    try {
      Object.assign(post, JSON.parse(localStorage.getItem(DRAFT) || '{}'));
    } catch {
      /* پرانا مسودہ پڑھا نہ جا سکا */
    }
  }

  root.innerHTML = `
<header class="bar"><a class="back" href="#/">واپس</a><span id="count" class="muted"></span></header>
<div class="kinds" role="radiogroup" aria-label="قسم">
  ${Object.entries(KINDS).map(([k, t]) => `<button type="button" class="kind${k === post.kind ? ' on' : ''}" data-kind="${k}" role="radio" aria-checked="${k === post.kind}">${t}</button>`).join('')}
</div>
<label class="cover-pick">
  <input id="file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="مرکزی تصویر منتخب کریں" hidden>
  <img id="prev" class="cover" alt="" ${post.cover_url ? `src="${esc(post.cover_url)}"` : 'hidden'}>
  <span id="pickText">${post.cover_url ? 'تصویر بدلیں' : 'مرکزی تصویر لگائیں'}</span>
</label>
<input id="title" class="f-title" aria-label="سرخی" placeholder="سرخی" maxlength="150" value="${esc(post.title)}">
<input id="sub" class="f-sub" aria-label="ذیلی سرخی (اختیاری)" placeholder="ذیلی سرخی (اختیاری)" maxlength="300" value="${esc(post.subtitle)}">
<textarea id="body" class="f-body" aria-label="تحریر کا متن" placeholder="یہاں لکھیں…">${esc(post.body)}</textarea>
<p id="err" class="err" role="alert" hidden></p>
<div class="actions">
  <button class="btn" id="pub" type="button">شائع کریں</button>
  <button class="btn ghost" id="draft" type="button">مسودہ محفوظ کریں</button>
</div>`;

  const $ = (s) => root.querySelector(s);
  const state = () => ({ kind: post.kind, title: $('#title').value, subtitle: $('#sub').value, body: $('#body').value });
  let file = null;

  function refresh() {
    const ta = $('#body');
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(320, ta.scrollHeight)}px`;
    const words = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
    $('#count').textContent = `${urduNum(words)} الفاظ`;
    if (!editId) {
      try {
        localStorage.setItem(DRAFT, JSON.stringify(state()));
      } catch {
        /* جگہ نہیں */
      }
    }
  }

  root.querySelectorAll('[data-kind]').forEach((b) => {
    b.onclick = () => {
      post.kind = b.dataset.kind;
      root.querySelectorAll('[data-kind]').forEach((x) => {
        x.classList.toggle('on', x === b);
        x.setAttribute('aria-checked', String(x === b));
      });
      refresh();
    };
  });
  $('#file').onchange = (e) => {
    file = e.target.files[0] || null;
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      file = null;
      e.target.value = '';
      return fail('صرف JPEG، PNG یا WebP تصویر منتخب کریں۔');
    }
    $('#prev').src = URL.createObjectURL(file);
    $('#prev').hidden = false;
    $('#pickText').textContent = 'تصویر بدلیں';
  };
  ['#title', '#sub', '#body'].forEach((s) => $(s).addEventListener('input', refresh));

  const fail = (m) => {
    $('#err').textContent = m;
    $('#err').hidden = false;
  };
  const busy = (b) => {
    $('#pub').disabled = b;
    $('#draft').disabled = b;
  };

  async function upload(blob, name) {
    const path = `${user.id}/${name}.${extOf(blob)}`;
    const { error } = await supabase.storage.from('covers').upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
    if (error) throw error;
    return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
  }

  async function save(published) {
    const s = state();
    $('#err').hidden = true;
    if (s.title.trim().length < 3) return fail('سرخی کم از کم 3 حروف کی ہو۔');
    if (!s.body.trim()) return fail('متن خالی ہے۔');
    busy(true);
    try {
      let { cover_url, thumb_url } = post;
      if (file) {
        const stamp = Date.now();
        cover_url = await upload(await resizeImage(file, 1200, 0.8), stamp);
        thumb_url = await upload(await resizeImage(file, 640, 0.75), `${stamp}-t`);
      }
      const row = { kind: s.kind, title: s.title.trim(), subtitle: s.subtitle.trim(), body: s.body, cover_url, thumb_url, read_min: readMinutes(s.body), published };
      const q = editId
        ? supabase.from('posts').update(row).eq('id', editId).eq('author_id', user.id).select('id').single()
        : supabase.from('posts').insert({ ...row, author_id: user.id }).select('id').single();
      const { data, error } = await q;
      if (error) throw error;
      try {
        localStorage.removeItem(DRAFT);
      } catch {
        /* کوئی بات نہیں */
      }
      location.hash = `#/read/${data.id}`;
    } catch (err) {
      console.error('[Supabase] Post save or cover upload failed', err);
      fail('محفوظ نہیں ہو سکا۔ انٹرنیٹ، اجازت یا تصویر کی قسم/سائز دیکھ کر دوبارہ کوشش کریں۔');
      busy(false);
    }
  }

  $('#pub').onclick = () => save(true);
  $('#draft').onclick = () => save(false);
  refresh();
}
