import { supabase, configured, currentUser } from '../supabase.js';
import { card } from '../components/card.js';

const PAGE = 10;
const TABS = [['all', 'تازہ'], ['column', 'کالم'], ['article', 'مضامین'], ['story', 'افسانہ'], ['poetry', 'شاعری']];

// Supabase جڑنے سے پہلے ڈیزائن دیکھنے کے لیے نمونے (supabase.js میں قدریں ڈالتے ہی ختم)
const demoCover = (a, b) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 190"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="350" height="190" fill="url(#g)"/><circle cx="240" cy="95" r="34" fill="#fff" opacity=".55"/></svg>`
  );
const now = new Date().toISOString();
const SAMPLE = [
  { id: 'd1', kind: 'column', title: 'ہم نے خاموش رہنا کب سیکھا؟', subtitle: 'شور کے اس زمانے میں سب سے قیمتی لمحہ وہ ہے جب آدمی بغیر کسی جواب کے بس سن سکتا ہے۔', cover_url: demoCover('#F9D58B', '#E8735A'), read_min: 4, created_at: now, profiles: { pen_name: 'عائشہ رضا' } },
  { id: 'd2', kind: 'article', title: 'چائے کے کپ میں چھپی تاریخ', subtitle: 'ایک پیالی کے پیچھے صدیوں کا سفر، تجارت اور گھروں کی روایتیں۔', read_min: 5, created_at: now, profiles: { pen_name: 'سارہ خان' } },
  { id: 'd3', kind: 'column', title: 'موبائل کی روشنی میں بچپن', subtitle: 'بچے اب شام کو محلے میں نہیں، اسکرین کے اندر کھیلتے ہیں۔', cover_url: demoCover('#1F2F55', '#46709B'), read_min: 3, created_at: now, profiles: { pen_name: 'علی رضوان' } },
  { id: 'd4', kind: 'story', title: 'آخری بس', subtitle: 'اسٹاپ پر کھڑے اس آدمی کو معلوم تھا کہ بس نہیں آئے گی، پھر بھی وہ انتظار کرتا رہا۔', read_min: 6, created_at: now, profiles: { pen_name: 'حنا فاروق' } },
  { id: 'd5', kind: 'poetry', title: 'شام کی چائے', subtitle: 'کھڑکی کے پار دھوپ سمٹتی چلی گئی، اور کپ میں کوئی پرانا نام گھلتا رہا', read_min: 1, created_at: now, profiles: { pen_name: 'سحرؔ' } },
];

async function load(kind, from) {
  if (!configured) {
    return SAMPLE.filter((p) => kind === 'all' || p.kind === kind).slice(from, from + PAGE);
  }
  let q = supabase
    .from('posts')
    .select('id,kind,title,subtitle,cover_url,thumb_url,read_min,created_at,author_id,profiles!posts_author_id_fkey(pen_name)')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .range(from, from + PAGE - 1);
  if (kind !== 'all') q = q.eq('kind', kind);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export function home(root, kind = 'all') {
  root.innerHTML = `
<header class="top"><div class="logo">Zuzu</div><a id="me" class="me" href="#/login">داخل ہوں</a></header>
<nav class="tabs" aria-label="اقسام">${TABS.map(([k, t]) => `<a class="tab${k === kind ? ' on' : ''}" href="#/feed/${k}">${t}</a>`).join('')}</nav>
<section id="feed"></section>
<button id="more" class="more" hidden>مزید</button>
<a class="fab" href="#/write" aria-label="نئی تحریر"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg></a>`;

  currentUser().then((u) => {
    const me = root.querySelector('#me');
    if (!u || !me) return;
    me.className = 'avatar';
    me.href = '#/author/me';
    me.setAttribute('aria-label', 'میرا پروفائل');
    me.textContent = [...(u.user_metadata?.pen_name || 'ق')][0];
  });

  const feed = root.querySelector('#feed');
  const more = root.querySelector('#more');
  let from = 0;

  async function next() {
    more.disabled = true;
    try {
      const rows = await load(kind, from);
      from += rows.length;
      feed.insertAdjacentHTML('beforeend', rows.map(card).join(''));
      more.hidden = rows.length < PAGE;
      if (from === 0) feed.innerHTML = '<p class="empty">اس قسم میں ابھی کوئی تحریر نہیں۔<br><a class="tab on" href="#/write">پہلی تحریر لکھیں</a></p>';
    } catch (err) {
      console.error(err);
      feed.insertAdjacentHTML('beforeend', '<p class="empty">تحریریں لوڈ نہیں ہو سکیں۔ انٹرنیٹ دیکھ کر دوبارہ کوشش کریں۔</p>');
    }
    more.disabled = false;
  }

  more.onclick = next;
  next();
}
