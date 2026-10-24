import { supabase, currentUser } from '../supabase.js';
import { KINDS, esc, readTime, formatDate } from '../utils.js';
import { openShareCard } from '../components/share-card.js';

const NOT_FOUND = '<p class="empty">یہ تحریر نہیں ملی۔<br><a class="tab on" href="#/">ہوم پر واپس</a></p>';
const SHARE_ICON =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg>';

// قاری نے جو سطریں منتخب کی ہوں وہ کارڈ پر آئیں (بٹن دبانے سے انتخاب ختم ہو جاتا ہے، اس لیے یاد رکھتے ہیں)
let picked = '';
document.addEventListener('selectionchange', () => {
  const s = String(getSelection()).trim();
  if (s.length >= 6 && document.querySelector('.r-body')?.contains(getSelection().anchorNode)) picked = s;
});

function excerptOf(p) {
  if (p.kind === 'poetry') return p.body.trim().split('\n').filter(Boolean).slice(0, 2).join('\n');
  return (p.subtitle || p.body.trim().split(/\n{2,}/)[0]).slice(0, 160);
}

export async function read(root, id) {
  picked = '';
  root.innerHTML = '<p class="empty">لوڈ ہو رہا ہے…</p>';
  const [{ data: p }, user] = await Promise.all([
    supabase.from('posts').select('*,profiles(pen_name)').eq('id', id).maybeSingle(),
    currentUser(),
  ]);
  if (!p) {
    root.innerHTML = NOT_FOUND;
    return;
  }
  const name = p.profiles?.pen_name || 'قلم کار';
  const mine = user?.id === p.author_id;
  const paras = p.body.split(/\n{2,}/).map((t) => `<p>${esc(t.trim())}</p>`).join('');

  root.innerHTML = `
<a class="back" href="#/">واپس</a>
<article class="read">
  ${p.cover_url ? `<img class="cover r-cover" src="${esc(p.cover_url)}" alt="">` : ''}
  <div class="meta"><span class="grp"><span class="chip">${esc(KINDS[p.kind] || '')}</span>${p.published ? '' : '<span class="chip draft">مسودہ</span>'}</span><span class="muted">${readTime(p.read_min)}</span></div>
  <h1>${esc(p.title)}</h1>
  ${p.subtitle ? `<p class="r-sub">${esc(p.subtitle)}</p>` : ''}
  <a class="author" href="#/author/${esc(p.author_id)}">
    <span class="avatar">${esc([...name][0])}</span>
    <span>${esc(name)}<small>${formatDate(p.created_at)}</small></span>
  </a>
  <div class="r-body">${paras}</div>
  <div class="actions">
    <button class="btn" data-share="${esc(p.id)}" data-title="${esc(p.title)}" type="button">${SHARE_ICON}&nbsp; شیئر کریں</button>
    <button class="btn ghost" id="cardBtn" type="button">کارڈ بنائیں</button>
    ${mine ? `<a class="btn ghost" href="#/write/${esc(p.id)}">ترمیم</a><button class="btn ghost danger" id="del" type="button">حذف کریں</button>` : ''}
  </div>
</article>`;

  root.querySelector('#cardBtn').onclick = () =>
    openShareCard({ text: picked || excerptOf(p), author: name });

  const del = root.querySelector('#del');
  if (del) {
    del.onclick = async () => {
      if (!confirm('یہ تحریر مستقل طور پر حذف ہو جائے گی۔ جاری رکھیں؟')) return;
      const { error } = await supabase.from('posts').delete().eq('id', p.id);
      if (error) alert('حذف نہیں ہو سکی۔ دوبارہ کوشش کریں۔');
      else location.hash = '#/author/me';
    };
  }
}
