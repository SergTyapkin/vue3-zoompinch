import { defineConfig, loadEnv } from 'vite';
import pluginVue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig(({ mode }: { command: 'build' | 'serve'; mode: 'development' | 'production' | string }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '.'));
  console.log(`Loaded env file(s) from: ${path.resolve(__dirname, '.')}:`, env);

  return {
    root: "./example",
    plugins: [
      pluginVue({
        include: [/\.vue$/],
      }),
    ],
    define: {
      BUILD_TIMESTAMP: Date.now(),
      BUILD_VERSION: JSON.stringify(import('./package.json').version),
    },
    server: {
      https: false,
    },
    build: {
      modulePreload: false,
      target: 'esnext',
      minify: false,
      cssCodeSplit: false,
      outDir: "../dist-example",
    },
    base: `/${env.VITE_BASE_PATH}/`
  };
});
