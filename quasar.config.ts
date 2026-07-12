import { defineConfig } from '#q-app';

export default defineConfig(() => ({
  boot: ['supabase', 'vue-query'],
  css: ['app.scss'],
  extras: ['roboto-font', 'material-icons'],

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
    plugins: [],
  },

  animations: [],

  pwa: {
    workboxMode: 'GenerateSW',
  },

  capacitor: {
    hideSplashscreen: true,
  },
}));
