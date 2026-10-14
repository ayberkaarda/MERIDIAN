// Shader sources are bundled as plain strings: webpack `asset/source` and the
// Turbopack `raw` rule in next.config.ts both expose the file as a default export.
declare module '*.glsl' {
  const source: string;
  export default source;
}

declare module '*.vert' {
  const source: string;
  export default source;
}

declare module '*.frag' {
  const source: string;
  export default source;
}
