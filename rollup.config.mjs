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
    output: { file: 'dist/js-xdr.d.ts', format: 'es' },
    plugins: [dts()]
  }
];
