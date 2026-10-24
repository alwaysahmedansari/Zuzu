import './style.css';
import { home } from './pages/home.js';
import { read } from './pages/read.js';
import { write } from './pages/write.js';
import { profile } from './pages/profile.js';
import { login } from './pages/login.js';
import { showLoadError } from './utils.js';

const root = document.getElementById('app');

function route() {
  const [, page, arg] = location.hash.split('/');
  try {
    const result = page === 'read' ? read(root, arg)
      : page === 'write' ? write(root, arg)
        : page === 'author' ? profile(root, arg)
          : page === 'login' ? login(root)
            : home(root, page === 'feed' ? arg || 'all' : 'all');
    Promise.resolve(result).catch((err) => {
      console.error('[Router] Page load failed', err);
      showLoadError(root, 'صفحہ لوڈ نہیں ہو سکا۔ دوبارہ کوشش کریں۔', route);
    });
  } catch (err) {
    console.error('[Router] Page render failed', err);
    showLoadError(root, 'صفحہ لوڈ نہیں ہو سکا۔ دوبارہ کوشش کریں۔', route);
  }
  window.scrollTo(0, 0);
}

// شیئر بٹن: فون کی شیئر شیٹ، ورنہ لنک کاپی
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-share]');
  if (!btn) return;
  const url = `${location.origin}${location.pathname}#/read/${btn.dataset.share}`;
  const title = btn.dataset.title || btn.closest('.card')?.querySelector('h2')?.textContent || 'Zuzu';
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
      btn.classList.add('done');
      setTimeout(() => btn.classList.remove('done'), 1200);
    }
  } catch {
    /* صارف نے شیئر منسوخ کر دیا */
  }
});

window.addEventListener('hashchange', route);
route();
