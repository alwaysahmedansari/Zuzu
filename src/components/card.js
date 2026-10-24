import { KINDS, esc, readTime, formatDate } from '../utils.js';

const SHARE_ICON =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg>';

// ایک تحریر کا کارڈ: (کور تصویر) + قسم + سرخی + ذیلی سرخی + مصنف + شیئر
export function card(p) {
  const name = p.profiles?.pen_name || 'قلم کار';
  const img = p.thumb_url || p.cover_url;
  const cover = img
    ? `<a href="#/read/${esc(p.id)}" tabindex="-1" aria-hidden="true"><img class="cover" src="${esc(img)}" alt="" loading="lazy"></a>`
    : '';
  return `
<article class="card">
  ${cover}
  <div class="card-body">
    <div class="meta"><span class="grp"><span class="chip">${esc(KINDS[p.kind] || '')}</span>${p.published === false ? '<span class="chip draft">مسودہ</span>' : ''}</span><span class="muted">${readTime(p.read_min)}</span></div>
    <a href="#/read/${esc(p.id)}"><h2>${esc(p.title)}</h2></a>
    ${p.subtitle ? `<p class="sub">${esc(p.subtitle)}</p>` : ''}
    <div class="foot">
      <a class="author" href="#/author/${esc(p.author_id || '')}">
        <span class="avatar">${esc([...name][0])}</span>
        <span>${esc(name)}<small>${formatDate(p.created_at)}</small></span>
      </a>
      <button class="icon-btn" data-share="${esc(p.id)}" aria-label="شیئر">${SHARE_ICON}</button>
    </div>
  </div>
</article>`;
}
