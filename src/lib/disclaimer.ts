// The Access To disclaimer, as shown inside the app. The wording is the shared
// interim text (pending attorney review); DISCLAIMER.md in the repo root is the
// long-form copy the notice links to.

export const PROJECT_TITLE = 'Access To Food';

export const DISCLAIMER_URL =
  'https://github.com/dougdevitre/access-to-food/blob/main/DISCLAIMER.md';

export const SHORT_NOTICE =
  `Educational information only. ${PROJECT_TITLE} is not legal, medical, mental health, financial or safety advice, and using it creates no professional relationship. In danger now? Call 911. For crisis support, call or text 988. Confirm anything important with the official source or a licensed professional.`;

// Each point is a bold lead (may be empty) followed by its body.
export const FULL_DISCLAIMER: ReadonlyArray<{ lead: string; body: string }> = [
  {
    lead: '',
    body: `${PROJECT_TITLE} provides general educational information only. It is not legal, medical, mental health, financial or safety advice. Using it does not create an attorney-client, clinician-patient or any other professional relationship with Doug Devitre, CoTrackPro or any contributor.`,
  },
  { lead: 'Not for emergencies.', body: 'If anyone is in danger, call 911. For crisis support, call or text 988.' },
  { lead: 'Not a substitute for a professional.', body: 'Talk with a licensed attorney, clinician or trained advocate about your situation.' },
  {
    lead: 'Information can be wrong or out of date.',
    body: 'Laws, programs, phone numbers, eligibility rules and deadlines change. Confirm everything with the official source before you rely on it.',
  },
  {
    lead: 'AI output can be incorrect.',
    body: 'Review everything it produces. You are responsible for the decisions you make and anything you file or send.',
  },
  { lead: 'Protect privacy.', body: 'Do not enter names, case numbers, addresses or other details that identify a person.' },
  { lead: 'No endorsement.', body: 'Not affiliated with or endorsed by any court, agency or organization it mentions.' },
  {
    lead: 'No warranty.',
    body: 'Provided "as is," without warranties of any kind. To the fullest extent the law allows, the maintainers and contributors are not liable for damages arising from its use.',
  },
];

// Bump the version when the wording changes materially, so everyone sees it again.
export const ACK_KEY = 'disclaimer-ack-v1';

// Routes where people type, submit, scan or chat. Crisis and listing pages
// (Home, Need Food Now, Partner Agencies, Events, Resources, Command Center)
// get the persistent notice only, so nothing sits in front of emergency help.
export const ACK_ROUTES: ReadonlyArray<string> = [
  '/assistant',
  '/scanner',
  '/volunteer',
  '/donate',
  '/snap',
  '/sortshift',
];

export function needsAcknowledgment(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  return ACK_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));
}

function defaultStorage(): Storage | undefined {
  try {
    return globalThis.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

// Storage can be missing or throw (private mode, blocked site data). Any
// failure reads as "not acknowledged", so the dialog simply shows again.
export function hasAcknowledged(storage: Storage | undefined = defaultStorage()): boolean {
  try {
    return storage?.getItem(ACK_KEY) != null;
  } catch {
    return false;
  }
}

export function recordAcknowledgment(storage: Storage | undefined = defaultStorage()): void {
  try {
    storage?.setItem(ACK_KEY, new Date().toISOString());
  } catch {
    // Best-effort: the acknowledgment still holds for this visit.
  }
}
