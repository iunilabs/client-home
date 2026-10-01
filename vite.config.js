import { defineConfig } from 'vite';

export default defineConfig({
  build: { rolldownOptions: { input: ['index.html', 'modelos.html', 'mano.html'] } },
});
