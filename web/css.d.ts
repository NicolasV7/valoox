// A CSS import is a build instruction, not a module with a shape. esbuild reads
// it and emits public/app.css; TypeScript only needs to be told it is allowed.
declare module '*.css';
