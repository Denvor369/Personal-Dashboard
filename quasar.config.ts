import { defineConfig } from '#q-app';

export default defineConfig(() => ({
  boot: ['vue-query'],
  css: ['app.scss', 'modules.scss'],
  extras: ['material-icons'],

  build: {
    typescript: {
      strict: true,
      vueShim: true,
    },
    env: {
      clientPrefix: ['QCLI_', 'VITE_'],
    },
    vueRouterMode: 'hash',
    vitePlugins: [
      [
        'vite-plugin-checker',
        {
          vueTsc: true,
          eslint: {
            lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{ts,js,mjs,cjs,vue}"',
            useFlatConfig: true,
          },
        },
        { server: false },
      ],
    ],
  },

  devServer: {
    open: false,
  },

  framework: {
    config: {},
    plugins: ['Notify', 'Dialog'],
  },

  animations: [],

  pwa: {
    workboxMode: 'GenerateSW',
  },

  capacitor: {
    hideSplashscreen: true,
  },
}));
