// شیئر کارڈ: سفید تصویر (1080×1350) جس پر اقتباس، مصنف کا نام اور "Zuzu پر لکھا گیا"
const W = 1080;
const H = 1350;
const FONT = '"Noto Nastaliq Urdu",serif';
const INK = '#14110f';
const ACCENT = '#d2492f';
const MUTED = '#5f5f5f';

function wrap(ctx, text, maxWidth) {
  const lines = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

async function draw({ text, author }) {
  await Promise.all(
    ['48px "Noto Nastaliq Urdu"', '600 48px Fredoka'].map((f) => document.fonts.load(f).catch(() => {}))
  );
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d6d6d6';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // آرائشی لکیر
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 150, 290);
  ctx.lineTo(W / 2 - 40, 290);
  ctx.moveTo(W / 2 + 40, 290);
  ctx.lineTo(W / 2 + 150, 290);
  ctx.moveTo(W / 2, 270);
  ctx.lineTo(W / 2 + 20, 290);
  ctx.lineTo(W / 2, 310);
  ctx.lineTo(W / 2 - 20, 290);
  ctx.closePath();
  ctx.stroke();

  // متن: جگہ میں آنے تک فونٹ چھوٹا کرتے جائیں
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;
  let size = 60;
  let lines = [];
  for (; size >= 34; size -= 4) {
    ctx.font = `${size}px ${FONT}`;
    lines = wrap(ctx, text, W - 240);
    if (lines.length * size * 2.3 <= 640) break;
  }
  const lh = size * 2.3;
  const start = 640 - (lines.length * lh) / 2 + lh / 2;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, start + i * lh));

  // مصنف
  ctx.fillStyle = ACCENT;
  ctx.font = `500 46px ${FONT}`;
  ctx.fillText(author, W / 2, 1040);

  // "Zuzu پر لکھا گیا"
  ctx.fillStyle = MUTED;
  ctx.font = `34px ${FONT}`;
  const ur = 'پر لکھا گیا';
  const uw = ctx.measureText(ur).width;
  ctx.font = '600 42px Fredoka, sans-serif';
  const zw = ctx.measureText('Zuzu').width;
  const left = W / 2 - (uw + 16 + zw) / 2;
  ctx.textAlign = 'left';
  ctx.font = `34px ${FONT}`;
  ctx.fillText(ur, left, 1190);
  ctx.direction = 'ltr';
  ctx.font = '600 42px Fredoka, sans-serif';
  ctx.fillText('Zuzu', left + uw + 16, 1186);

  return new Promise((ok) => c.toBlob(ok, 'image/png'));
}

export async function openShareCard({ text, author }) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="شیئر کارڈ"><p class="empty">کارڈ بن رہا ہے…</p></div>';
  document.body.append(modal);
  const sheet = modal.firstElementChild;
  const close = () => modal.remove();
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  try {
    const blob = await draw({ text, author });
    const url = URL.createObjectURL(blob);
    const file = new File([blob], 'zuzu-card.png', { type: 'image/png' });
    sheet.innerHTML = `
<img class="card-img" src="${url}" alt="شیئر کارڈ">
<div class="actions">
  <button class="btn" id="cs" type="button">شیئر کریں</button>
  <a class="btn ghost" id="cd" href="${url}" download="zuzu-card.png">محفوظ کریں</a>
  <button class="btn ghost" id="cx" type="button">بند کریں</button>
</div>`;
    sheet.querySelector('#cx').onclick = close;
    sheet.querySelector('#cs').onclick = async () => {
      try {
        if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] });
        else sheet.querySelector('#cd').click();
      } catch {
        /* صارف نے منسوخ کر دیا */
      }
    };
  } catch (err) {
    console.error(err);
    sheet.innerHTML = '<p class="empty">کارڈ نہیں بن سکا۔ دوبارہ کوشش کریں۔</p><div class="actions"><button class="btn ghost" id="cx" type="button">بند کریں</button></div>';
    sheet.querySelector('#cx').onclick = close;
  }
}
