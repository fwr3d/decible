import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Decible',
  description: 'A context-aware audio agent for Spotify-powered browser sessions.',
  version: '0.1.0',
  action: {
    default_title: 'Decible',
    default_popup: 'index.html',
  },
  permissions: ['storage', 'tabs'],
  host_permissions: ['<all_urls>'],
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content.ts'],
      run_at: 'document_idle',
    },
  ],
})
