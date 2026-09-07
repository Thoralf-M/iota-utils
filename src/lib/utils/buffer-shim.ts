// Named-export shim for the `buffer` polyfill.
//
// Vite prebundles the CJS `buffer` package into a module with only a default
// export, so `import { Buffer } from 'buffer'` fails at runtime. The `buffer`
// specifier is aliased to this file (see vite.config.ts), which re-exports
// `Buffer` as a named export. `buffer/index.js` is imported directly here so
// the alias does not apply to it.
import bufferModule from 'buffer/index.js';

export const Buffer = bufferModule.Buffer;

export default bufferModule;
