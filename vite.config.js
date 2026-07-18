import { resolve, path } from 'path'
import { defineConfig } from 'vite';
import injectHTML from 'vite-plugin-html-inject';
import fs from 'fs';

export default defineConfig({
  plugins: [
    injectHTML() // used for the partial html snippet like navbar (templates)
  ],
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        projects: resolve(__dirname, 'projects/index.html'),
          santashooter: resolve(__dirname, 'projects/santashooter/index.html'),
          aopt: resolve(__dirname, 'projects/aopt/index.html'),
        cv: resolve(__dirname, 'cv/index.html'),
        bookshelf: resolve(__dirname, 'bookshelf/index.html'),
        auth: resolve(__dirname, 'auth/index.html'),
      },
    },
  },
});
