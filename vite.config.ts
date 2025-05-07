import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import inject from '@rollup/plugin-inject';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte(),
    // Required for the HID connection for Ledger devices
    inject({
        Buffer: ['buffer', 'Buffer'],
    })],

})
