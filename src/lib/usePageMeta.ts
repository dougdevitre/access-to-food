import { useEffect } from 'react';

const SITE = 'access-to-food';

// Sets the document title per route so the browser tab, history, and shared
// links reflect the current page instead of a single static title.
export function usePageMeta(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : `${SITE} | Community Food Resource Hub`;
  }, [title]);
}
