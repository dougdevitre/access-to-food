import { afterEach, describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '../src/components/Layout';
import {
  ACK_KEY,
  DISCLAIMER_URL,
  SHORT_NOTICE,
  hasAcknowledged,
  needsAcknowledgment,
  recordAcknowledgment,
} from '../src/lib/disclaimer';

// Every route renders inside Layout, so the persistent notice lives there.
function renderAt(path: string) {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(
        Routes,
        null,
        createElement(Route, { path: '/*', element: createElement(Layout) }),
      ),
    ),
  );
}

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (k) => (data.has(k) ? data.get(k)! : null),
    key: (i) => Array.from(data.keys())[i] ?? null,
    removeItem: (k) => { data.delete(k); },
    setItem: (k, v) => { data.set(k, String(v)); },
  };
}

function throwingStorage(): Storage {
  const fail = () => { throw new Error('SecurityError: storage blocked'); };
  return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('persistent disclaimer notice', () => {
  it('uses the canonical short wording with the project title', () => {
    expect(SHORT_NOTICE).toBe(
      'Educational information only. Access To Food is not legal, medical, mental health, financial or safety advice, and using it creates no professional relationship. In danger now? Call 911. For crisis support, call or text 988. Confirm anything important with the official source or a licensed professional.',
    );
  });

  it.each(['/', '/need-food', '/assistant', '/volunteer'])(
    'renders on %s with tappable 911 and 988 and the full-disclaimer link',
    (path) => {
      const html = renderAt(path);
      const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
      expect(text).toContain(SHORT_NOTICE);
      expect(html).toContain('href="tel:911"');
      expect(html).toContain('href="tel:988"');
      expect(html).toContain(`href="${DISCLAIMER_URL}"`);
      expect(html).toContain('Read the full disclaimer');
    },
  );
});

describe('one-time acknowledgment', () => {
  it('is required on interactive routes only, never on crisis or listing pages', () => {
    for (const p of ['/assistant', '/scanner', '/volunteer', '/donate', '/snap', '/sortshift']) {
      expect(needsAcknowledgment(p), p).toBe(true);
    }
    for (const p of ['/', '/need-food', '/pantries', '/events', '/resources', '/dashboard']) {
      expect(needsAcknowledgment(p), p).toBe(false);
    }
  });

  it('persists under a versioned key', () => {
    const storage = memoryStorage();
    expect(ACK_KEY).toBe('disclaimer-ack-v1');
    expect(hasAcknowledged(storage)).toBe(false);
    recordAcknowledgment(storage);
    expect(storage.getItem(ACK_KEY)).not.toBeNull();
    expect(hasAcknowledged(storage)).toBe(true);
  });

  it('treats blocked storage as not acknowledged and never throws', () => {
    const storage = throwingStorage();
    expect(() => recordAcknowledgment(storage)).not.toThrow();
    expect(hasAcknowledged(storage)).toBe(false);
    expect(hasAcknowledged(undefined)).toBe(false);
  });

  it('shows the dialog on an interactive route before first use', () => {
    vi.stubGlobal('localStorage', memoryStorage());
    const html = renderAt('/assistant');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('I understand');
    expect(html).toContain('No warranty.');
  });

  it('does not show the dialog once acknowledged', () => {
    const storage = memoryStorage();
    recordAcknowledgment(storage);
    vi.stubGlobal('localStorage', storage);
    expect(renderAt('/assistant')).not.toContain('role="dialog"');
  });

  it('does not put the dialog in front of the Need Food Now crisis page', () => {
    vi.stubGlobal('localStorage', memoryStorage());
    expect(renderAt('/need-food')).not.toContain('role="dialog"');
  });
});
