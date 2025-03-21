import { defineConfig } from 'tsup';
import { resolve } from 'path';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
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