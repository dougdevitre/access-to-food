// The Anthropic key is server-side only (CLAUDE.md, "Hard constraints"). The
// client may import `@anthropic-ai/sdk` for its types and nothing else: a
// value import would pull the SDK, and the temptation to put a key next to
// it, into the public bundle. CI's grep over dist/assets is the last line of
// defence; this catches it at the source, before a build.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name) && !name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

// Matches every import/require form that would load the SDK at runtime.
const VALUE_IMPORT = [
  /^\s*import\s+(?!type\b)[^;]*?\bfrom\s+['"]@anthropic-ai\/sdk/m, // import X / {X} / * as X from
  /^\s*import\s+['"]@anthropic-ai\/sdk/m, // side-effect import
  /\bimport\s*\(\s*['"]@anthropic-ai\/sdk/, // dynamic import()
  /\brequire\s*\(\s*['"]@anthropic-ai\/sdk/, // CommonJS
];
const TYPE_IMPORT = /^\s*import\s+type\b[^;]*?\bfrom\s+['"]@anthropic-ai\/sdk/m;

describe('client source never loads @anthropic-ai/sdk at runtime', () => {
  const files = walk(SRC);

  it('scans the client source tree', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files.map((f) => [relative(ROOT, f), f]))('%s', (_label, file) => {
    const source = readFileSync(file, 'utf8');
    if (!source.includes('@anthropic-ai/sdk')) return;
    for (const pattern of VALUE_IMPORT) {
      expect(source, `${_label} imports the SDK as a value; use \`import type\``).not.toMatch(pattern);
    }
    // Anything that mentions the package must be an `import type`.
    expect(source).toMatch(TYPE_IMPORT);
  });

  it('the Assistant page (which types its messages with the SDK) uses import type', () => {
    const source = readFileSync(join(SRC, 'pages', 'Assistant.tsx'), 'utf8');
    expect(source).toMatch(/import type Anthropic from '@anthropic-ai\/sdk'/);
  });

  it('no client source references the server-only key variable or the browser escape hatch', () => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source, relative(ROOT, file)).not.toMatch(/dangerouslyAllowBrowser/);
      expect(source, relative(ROOT, file)).not.toMatch(/sk-ant-/);
      expect(source, relative(ROOT, file)).not.toMatch(/import\.meta\.env\.\w*ANTHROPIC/);
    }
  });
});

describe('the Vite config cannot inline the key', () => {
  it('has no `define` block and never mentions ANTHROPIC_API_KEY as a value', () => {
    const source = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
    expect(source).not.toMatch(/^\s*define\s*:/m);
    expect(source).not.toMatch(/process\.env\.ANTHROPIC_API_KEY/);
  });
});
