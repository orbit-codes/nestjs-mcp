import { defineConfig } from 'tsup';
import { resolve } from 'path';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    outExtension({ format }) {
        return {
            js: format === 'cjs' ? '.js' : '.mjs',
        };
    },
    treeshake: true,
    esbuildOptions(options) {
        options.alias = {
            '@lib': resolve(__dirname, 'src')
        };
    },
    external: [
        '@nestjs/common',
        '@nestjs/core',
        'reflect-metadata',
        '@modelcontextprotocol/sdk',
        'zod',
    ],
}); 