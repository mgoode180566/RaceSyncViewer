import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/racesync': {
                target: 'http://192.168.4.1',
                changeOrigin: true,
                rewrite: function (path) {
                    return path.replace(/^\/racesync/, '');
                },
            },
        },
    },
});
