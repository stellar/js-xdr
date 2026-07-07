import esbuild from 'rollup-plugin-esbuild';
import { dts } from 'rollup-plugin-dts';

const input = 'src/index.ts';

export default [
  {
    input,
    output: [
      { file: 'dist/js-xdr.mjs', format: 'es', sourcemap: true },
      {
        file: 'dist/js-xdr.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      }
    ],
    plugins: [esbuild({ target: 'es2022', sourceMap: true })]
  },
  {
    input,
    output: [
      // .d.mts for the ESM condition, .d.ts (interpreted as CJS by node16
      // resolution) for require and legacy consumers. Same content; the
      // extension is what tells TypeScript which module format it describes.
      { file: 'dist/js-xdr.d.mts', format: 'es' },
      { file: 'dist/js-xdr.d.ts', format: 'es' }
    ],
    plugins: [dts()]
  }
];
