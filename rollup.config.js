import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'

const plugins = [
  typescript({
    declaration: false,
    declarationDir: null
  }),
  terser({
    format: {
      comments: false
    }
  })
]

export default [
  // ES module
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
    },
    plugins
  },
  // CommonJS module(Node.js)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      exports: 'default',
    },
    plugins
  },
  // UMD module(Browser script tag)
  {
    input: 'src/index.ts',
    output: {
      name: 'StreamAudioPlayer',
      file: 'dist/index.min.js',
      format: 'umd',
      exports: 'default',
    },
    plugins
  },
  // TypeScript declaration
  {
    input: './dist/index.d.ts',
    output: {
      file: 'dist/types.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  }
]
