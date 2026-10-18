import { describe, it, expect } from 'vitest';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import Layout from '../src/components/Layout';
import { EMERGENCY_BAR_LABEL, SHORT_NOTICE } from '../src/lib/disclaimer';
import Home from '../src/pages/Home';
import NeedFood from '../src/pages/NeedFood';
import Pantries from '../src/pages/Pantries';
import Events from '../src/pages/Events';
import Assistant from '../src/pages/Assistant';
import Scanner from '../src/pages/Scanner';
import Volunteer from '../src/pages/Volunteer';
import SortShift from '../src/pages/SortShift';
import Donate from '../src/pages/Donate';
import Snap from '../src/pages/Snap';
import Resources from '../src/pages/Resources';
import CommandCenter from '../src/pages/CommandCenter';

// Phone-check guards: the in-view emergency bar, the light-only disclaimer, and
// the page structure an audit at 320/375px found broken (headings, labels,
// names, keyboard-unreachable click targets).

const ROUTES: Array<[string, ComponentType]> = [
  ['/', Home],
  ['/need-food', NeedFood],
  ['/pantries', Pantries],
  ['/events', Events],
  ['/assistant', Assistant],
  ['/scanner', Scanner],
  ['/volunteer', Volunteer],
  ['/sortshift', SortShift],
  ['/donate', Donate],
  ['/snap', Snap],
  ['/resources', Resources],
  ['/dashboard', CommandCenter],
];

// Layout with the real page in its outlet, as the app renders it.
function renderRoute(path: string, Page: ComponentType) {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(
        Routes,
        null,
        createElement(Route, { path: '/', element: createElement(Layout) },
          createElement(Route, { path: path === '/' ? undefined : path.slice(1), index: path === '/' ? true : undefined, element: createElement(Page) }),
        ),
      ),
    ),
  );
}

const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const attrs = (tag: string) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

function emergencyBar(html: string) {
  const start = html.indexOf(`aria-label="${EMERGENCY_BAR_LABEL}"`);
  if (start < 0) return null;
  const open = html.lastIndexOf('<div', start);
  return { open, html: html.slice(open, html.indexOf('</div>', start) + 6) };
}

describe('emergency bar (911/988 in view)', () => {
  it.each(ROUTES)('is pinned above the header on %s', (path, Page) => {
    const html = renderRoute(path, Page);
    const bar = emergencyBar(html);
    expect(bar, 'emergency bar missing').not.toBeNull();
    const barTag = html.slice(bar!.open, html.indexOf('>', bar!.open) + 1);
    expect(attrs(barTag).role).toBe('region');
    expect(text(bar!.html).trim()).toBe('In danger? Call 911 · Crisis: call or text 988');

    // Two tel: links, each at least 44px tall.
    const links = [...bar!.html.matchAll(/<a\b[^>]*>/g)].map((m) => attrs(m[0]));
    expect(links.map((a) => a.href)).toEqual(['tel:911', 'tel:988']);
    for (const a of links) expect(a.class.split(/\s+/)).toContain('min-h-11');

    // Safe-area insets on the notch side and the edges.
    expect(attrs(barTag).class).toContain('env(safe-area-inset-top)');
    expect(attrs(barTag).class).toContain('env(safe-area-inset-left)');
    expect(attrs(barTag).class).toContain('env(safe-area-inset-right)');

    // It shares one sticky wrapper with the header, so it is never fixed over content.
    const wrapperOpen = html.lastIndexOf('<div', bar!.open - 1);
    const wrapperTag = html.slice(wrapperOpen, html.indexOf('>', wrapperOpen) + 1);
    expect(attrs(wrapperTag).class.split(/\s+/)).toEqual(expect.arrayContaining(['sticky', 'top-0']));
    expect(html.indexOf('<header', bar!.open)).toBeGreaterThan(bar!.open);
    expect(html).not.toMatch(/<header[^>]*class="[^"]*\b(sticky|fixed)\b/);
  });

  it('keeps the long notice in the footer only, once', () => {
    const t = text(renderRoute('/need-food', NeedFood));
    expect(t.split(SHORT_NOTICE).length - 1).toBe(1);
  });
});

describe('disclaimer follows the light theme', () => {
  it('has no dark: variants in the notice, the bar or the dialog', () => {
    const src = readFileSync(join(__dirname, '../src/components/Disclaimer.tsx'), 'utf8');
    expect(src.match(/\bdark:[^\s'"`]+/g) ?? []).toEqual([]);
  });
});

describe('page structure', () => {
  it.each(ROUTES)('%s has one h1 and no skipped heading levels', (path, Page) => {
    const html = renderRoute(path, Page);
    const levels = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    const skips = levels.flatMap((l, i) => (i > 0 && l > levels[i - 1] + 1 ? [`h${levels[i - 1]}->h${l}`] : []));
    expect(skips).toEqual([]);
  });

  it.each(ROUTES)('%s labels every form field and names every button', (path, Page) => {
    const html = renderRoute(path, Page);
    const labelled = new Set([...html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)].map((m) => m[1]));
    const unlabelled = [...html.matchAll(/<(input|select|textarea)\b[^>]*>/g)]
      .map((m) => attrs(m[0]))
      .filter((a) => a.type !== 'hidden' && a.type !== 'file')
      .filter((a) => !a['aria-label'] && !(a.id && labelled.has(a.id)));
    expect(unlabelled).toEqual([]);

    const unnamed = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
      .filter((m) => !attrs(m[1])['aria-label'] && text(m[2]).trim() === '')
      .map((m) => m[0].slice(0, 120));
    expect(unnamed).toEqual([]);
  });
});

// A <div onClick> is invisible to keyboards and screen readers unless it takes
// a role (and the tabIndex/onKeyDown that go with it) or is a decorative backdrop.
function clickableDivs(source: string): string[] {
  const found: string[] = [];
  for (const m of source.matchAll(/<div\b/g)) {
    let depth = 0;
    let quote = '';
    let end = m.index! + 4;
    for (; end < source.length; end++) {
      const c = source[end];
      if (quote) { if (c === quote) quote = ''; continue; }
      if (c === '"' || c === "'" || c === '`') quote = c;
      else if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) break;
    }
    const tag = source.slice(m.index!, end);
    if (/\bonClick=/.test(tag) && !/\brole=/.test(tag) && !/aria-hidden="true"/.test(tag)) found.push(tag.replace(/\s+/g, ' ').slice(0, 100));
  }
  return found;
}

describe('keyboard reachability', () => {
  const dirs = ['../src/pages', '../src/components'].map((d) => join(__dirname, d));
  const files = dirs.flatMap((d) => readdirSync(d).filter((f) => f.endsWith('.tsx')).map((f) => join(d, f)));

  it.each(files.map((f) => [f.split('/src/')[1], f]))('%s has no click-only divs', (_name, file) => {
    expect(clickableDivs(readFileSync(file, 'utf8'))).toEqual([]);
  });
});
