import test from 'node:test';
import assert from 'node:assert/strict';
import { card } from '../src/components/card.js';
import { esc, readMinutes, readTime, urduNum } from '../src/utils.js';

test('esc safely encodes user-provided HTML characters', () => {
  assert.equal(esc(`<script title="x">'&</script>`), '&lt;script title=&quot;x&quot;&gt;&#39;&amp;&lt;/script&gt;');
});

test('read-time helpers support Urdu numerals and whitespace-separated text', () => {
  assert.equal(urduNum(120), '۱۲۰');
  assert.equal(readTime(3), '۳ منٹ کا مطالعہ');
  assert.equal(readMinutes('ایک   دو\nتین'), 1);
  assert.equal(readMinutes(Array(361).fill('لفظ').join(' ')), 2);
});

test('post cards escape user-controlled text and identifiers', () => {
  const html = card({
    id: '"><script>alert(1)</script>',
    author_id: 'author"><img src=x>',
    kind: 'article',
    title: '<img src=x onerror=alert(1)>',
    subtitle: 'A & B',
    read_min: 1,
    created_at: '2026-01-01T00:00:00Z',
    profiles: { pen_name: '<b>Writer</b>' },
  });

  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(html.includes('author&quot;&gt;&lt;img src=x&gt;'));
  assert.ok(html.includes('&lt;b&gt;Writer&lt;/b&gt;'));
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
});
