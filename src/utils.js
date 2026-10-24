export const KINDS = {
  column: 'کالم',
  article: 'مضمون',
  story: 'افسانہ',
  poetry: 'شاعری',
  diary: 'ڈائری',
  letter: 'خط',
};

const MONTHS = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];

export const urduNum = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

export const readTime = (m) => `${urduNum(m || 1)} منٹ کا مطالعہ`;

export function formatDate(iso) {
  const d = new Date(iso);
  const year = d.getFullYear() === new Date().getFullYear() ? '' : ` ${urduNum(d.getFullYear())}`;
  return `${urduNum(d.getDate())} ${MONTHS[d.getMonth()]}${year}`;
}

// صارف کا لکھا متن صفحے میں ڈالنے سے پہلے ہمیشہ اسی سے گزارنا ہے
export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const readMinutes = (text) => Math.max(1, Math.round(text.trim().split(/\s+/).length / 180));

export function showLoadError(root, message, retry) {
  root.innerHTML = `<section class="empty" role="alert"><p>${esc(message)}</p><button class="btn ghost" id="retry-load" type="button">دوبارہ کوشش کریں</button></section>`;
  root.querySelector('#retry-load')?.addEventListener('click', retry);
}

// تصویر کو فون ہی پر چھوٹا کر کے WebP (نہ ہو تو JPEG) بناتا ہے تاکہ مفت جگہ اور ٹریفک بچے
export async function resizeImage(file, maxWidth, quality) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bmp.width);
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const toBlob = (type) => new Promise((ok) => c.toBlob(ok, type, quality));
  let out = await toBlob('image/webp');
  if (!out || out.type !== 'image/webp') out = await toBlob('image/jpeg');
  return out;
}
export const extOf = (blob) => (blob.type === 'image/webp' ? 'webp' : 'jpg');
