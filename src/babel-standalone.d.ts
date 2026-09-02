declare module '@babel/standalone' {
  interface TransformOptions {
    presets?: unknown[];
    plugins?: unknown[];
    filename?: string;
    [key: string]: unknown;
  }
  interface TransformResult {
    code: string;
    ast?: unknown;
  }
  const Babel: {
    transform(code: string, options?: TransformOptions): TransformResult;
    transformScript(code: string, options?: TransformOptions): TransformResult;
    transformFromAst?(ast: unknown, code: string, options?: TransformOptions): TransformResult;
    availablePresets?: Record<string, unknown>;
    availablePlugins?: Record<string, unknown>;
  };
  export default Babel;
}
