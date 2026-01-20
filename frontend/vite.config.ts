import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // @ts-ignore - api and silenceDeprecations options are supported but not typed yet
        api: 'modern-compiler',
        silenceDeprecations: ['import'],
      },
    },
  },
});
