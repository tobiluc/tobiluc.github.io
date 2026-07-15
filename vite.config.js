import { resolve } from 'path'
import { defineConfig } from 'vite';
import injectHTML from 'vite-plugin-html-inject';

export default defineConfig({
  plugins: [
    injectHTML()
  ],
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        projects: resolve(__dirname, 'projects.html'),
        cv: resolve(__dirname, 'cv.html'),
        bookshelf: resolve(__dirname, 'bookshelf.html'),
      },
    },
  },
});
