import { supabase, currentUser } from '../supabase.js';
import { esc } from '../utils.js';
import { card } from '../components/card.js';

export async function profile(root, arg) {
  const user = await currentUser();
  const id = arg === 'me' ? user?.id : arg;
  if (!id) {
    sessionStorage.setItem('next', '#/author/me');
    location.hash = '#/login';
    return;
  }
  root.innerHTML = '<p class="empty">لوڈ ہو رہا ہے…</p>';
  const [{ data: prof }, { data: posts }] = await Promise.all([
    supabase.from('profiles').select('id,pen_name,bio').eq('id', id).maybeSingle(),
    supabase
      .from('posts')
      .select('id,kind,title,subtitle,cover_url,thumb_url,read_min,created_at,author_id,published,profiles!posts_author_id_fkey(pen_name)')
      .eq('author_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);
  if (!prof) {
    root.innerHTML = '<p class="empty">یہ مصنف نہیں ملے۔<br><a class="tab on" href="#/">ہوم پر واپس</a></p>';
    return;
  }
  const mine = user?.id === id;

  root.innerHTML = `
<a class="back" href="#/">واپس</a>
<section class="profile">
  <span class="avatar big">${esc([...prof.pen_name][0])}</span>
  <h1>${esc(prof.pen_name)}</h1>
  ${prof.bio ? `<p class="bio">${esc(prof.bio)}</p>` : ''}
  ${mine ? `
  <div class="actions">
    <a class="btn" href="#/write">نئی تحریر</a>
    <button class="btn ghost" id="edit" type="button">پروفائل بدلیں</button>
    <button class="btn ghost" id="out" type="button">باہر نکلیں</button>
  </div>
  <form id="pf" class="form" hidden>
    <label>تخلص<input name="pen" maxlength="40" value="${esc(prof.pen_name)}"></label>
    <label>تعارف<textarea name="bio" maxlength="300">${esc(prof.bio)}</textarea></label>
    <p id="err" class="err" role="alert" hidden></p>
    <button class="btn" type="submit">محفوظ کریں</button>
  </form>` : ''}
</section>
<section>${(posts || []).map(card).join('') || '<p class="empty">ابھی کوئی تحریر نہیں۔</p>'}</section>`;

  if (!mine) return;
  root.querySelector('#edit').onclick = () => {
    const f = root.querySelector('#pf');
    f.hidden = !f.hidden;
  };
  root.querySelector('#out').onclick = async () => {
    await supabase.auth.signOut();
    location.hash = '#/';
  };
  root.querySelector('#pf').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const err = f.querySelector('#err');
    const pen = f.pen.value.trim();
    if (pen.length < 2 || pen.length > 40) {
      err.textContent = 'تخلص 2 سے 40 حروف کا ہونا چاہیے۔';
      err.hidden = false;
      return;
    }
    const { error } = await supabase.from('profiles').update({ pen_name: pen, bio: f.bio.value.trim() }).eq('id', id);
    if (error) {
      err.textContent = 'محفوظ نہیں ہو سکا۔ دوبارہ کوشش کریں۔';
      err.hidden = false;
      return;
    }
    await supabase.auth.updateUser({ data: { pen_name: pen } });
    profile(root, 'me');
  };
}
