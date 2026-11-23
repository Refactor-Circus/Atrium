// The workbench's demo app as a headless front end: `composer serve` in the
// package root serves the API on :8000, `pnpm dev` here serves this on :3000.
// It extends the layer from its path, as a host does from git
// (`github:refactor-circus/atrium/nuxt/layer#<sha>`).
export default defineNuxtConfig({
  extends: ['../layer'],

  runtimeConfig: {
    public: {
      atrium: {
        apiBase: 'http://127.0.0.1:8000/atrium/api',
        // The workbench's stand-in token (workbench-only
        // AuthenticateWorkbenchToken). Never ship a fixed token.
        token: 'workbench'
      }
    }
  },

  devtools: { enabled: true },
  compatibilityDate: '2026-11-01'
})
