import { defineConfig } from 'vite';

// './' کی وجہ سے سائٹ GitHub Pages کے کسی بھی ذیلی پتے (username.github.io/zuzu) پر چلتی ہے
export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
});
