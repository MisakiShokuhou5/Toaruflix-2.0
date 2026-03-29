// ARQUIVO: vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react({
    // Adicionar este bloco, se necessário
    babel: {
      plugins: [
        'babel-plugin-styled-components',
      ],
    },
  }), cloudflare()],
});