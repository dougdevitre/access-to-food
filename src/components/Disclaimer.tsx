import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Info } from 'lucide-react';
import {
  DISCLAIMER_URL,
  FULL_DISCLAIMER,
  PROJECT_TITLE,
  SHORT_NOTICE,
  hasAcknowledged,
  needsAcknowledgment,
  recordAcknowledgment,
} from '../lib/disclaimer';

const linkClass =
  'font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600';

// Turns "911" and "988" in a sentence into tel: links without changing the
// wording. The ::after box widens each tap target to at least 44px without
// changing line height.
function withEmergencyLinks(text: string): ReactNode[] {
  return text.split(/(911|988)/).map((part, i) => {
    if (part === '911' || part === '988') {
      return (
        <a
          key={i}
          href={`tel:${part}`}
          aria-label={part === '911' ? 'Call 911' : 'Call or text 988'}
          className={`${linkClass} relative whitespace-nowrap after:absolute after:-inset-x-3 after:-inset-y-3.5`}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

// Persistent short notice, shown at the foot of every page.
export function DisclaimerNotice() {
  return (
    <footer
      aria-label="Disclaimer"
      className="border-t border-stone-200 bg-white text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
    >
      <div className="mx-auto flex max-w-7xl gap-3 px-4 py-5 md:px-8">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-stone-400 dark:text-stone-500" aria-hidden="true" />
        <p className="text-sm leading-relaxed">
          {withEmergencyLinks(SHORT_NOTICE)}{' '}
          <a
            href={DISCLAIMER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} inline-flex min-h-11 items-center`}
          >
            Read the full disclaimer
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </div>
    </footer>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// One-time acknowledgment before first use of an interactive page. Remembered
// per browser; if storage is unavailable it simply shows again next visit.
export function DisclaimerAcknowledgment() {
  const { pathname } = useLocation();
  const [acknowledged, setAcknowledged] = useState(() => hasAcknowledged());
  const [escPressed, setEscPressed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const open = !acknowledged && needsAcknowledgment(pathname);

  useEffect(() => {
    if (!open) return;
    const overlay = dialogRef.current?.parentElement;
    const dialog = dialogRef.current;
    if (!overlay || !dialog) return;

    const previous = document.activeElement as HTMLElement | null;
    // Make the rest of the app unreachable while the dialog is open.
    const siblings = Array.from(overlay.parentElement?.children ?? []).filter(
      (el): el is HTMLElement => el !== overlay && el instanceof HTMLElement && !el.inert,
    );
    siblings.forEach((el) => { el.inert = true; });
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    dialog.focus();

    const keepFocusInside = (e: FocusEvent) => {
      if (e.target instanceof Node && !dialog.contains(e.target)) dialog.focus();
    };
    document.addEventListener('focusin', keepFocusInside);

    return () => {
      document.removeEventListener('focusin', keepFocusInside);
      siblings.forEach((el) => { el.inert = false; });
      root.style.overflow = prevOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      // Escape never dismisses silently: point to the button instead.
      e.preventDefault();
      e.stopPropagation();
      setEscPressed(true);
      buttonRef.current?.focus();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const acknowledge = () => {
    recordAcknowledgment();
    setAcknowledged(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
        aria-describedby="disclaimer-intro"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white text-stone-700 shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:bg-stone-900 dark:text-stone-200"
      >
        <div className="space-y-4 p-6 sm:p-8">
          <h2 id="disclaimer-title" className="text-xl font-bold text-stone-800 dark:text-stone-50">
            Before you use {PROJECT_TITLE}
          </h2>
          <p id="disclaimer-intro" className="text-sm font-medium text-stone-500 dark:text-stone-400">
            Please read this once. You can find it again at the bottom of every page.
          </p>
          <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed marker:text-stone-400">
            {FULL_DISCLAIMER.map(({ lead, body }) => (
              <li key={lead || 'intro'}>
                {lead && <strong className="font-semibold text-stone-800 dark:text-stone-50">{lead} </strong>}
                {withEmergencyLinks(body)}
              </li>
            ))}
          </ul>
        </div>
        <div className="sticky bottom-0 space-y-2 border-t border-stone-100 bg-white p-4 sm:px-8 dark:border-stone-700 dark:bg-stone-900">
          <p aria-live="polite" className="text-xs text-stone-500 dark:text-stone-400">
            {escPressed ? 'Select “I understand” to continue.' : ''}
          </p>
          <button
            ref={buttonRef}
            type="button"
            onClick={acknowledge}
            className="min-h-11 w-full rounded-2xl bg-emerald-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 motion-safe:transition-colors"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}
