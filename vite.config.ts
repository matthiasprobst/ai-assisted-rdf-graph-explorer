import path from 'path';
import react from '@vitejs/plugin-react';

export default {
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  build: {
    sourcemap: false, // Completely disable source maps
    minify: 'esbuild', // Use esbuild for better Firefox compatibility
    target: 'es2015', // Target modern Firefox
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Remove all source map references
        assetFileNames: (assetInfo) => {
          // Ensure no .map files are generated
          const info = assetInfo.name.split('.');
          return `${info[0]}.${info[1]}`;
        }
      }
    },
    // Firefox-specific optimization
    cssCodeSplit: false,
    assetsInlineLimit: 4096 // Small inline assets for Firefox
  },
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || '')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
};