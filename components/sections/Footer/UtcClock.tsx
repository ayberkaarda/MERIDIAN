'use client';

import { useEffect, useState } from 'react';
import { footer, formatUtcClock } from '@/data/footer';

/**
 * Live UTC time, the one piece of text on the page that changes on its own.
 * The server and the first client render show a placeholder of the same
 * length; ticking starts after mount, aligned to the second boundary. The
 * slot has a fixed width in tabular figures, so a tick never moves layout,
 * and it is not a live region, so assistive tech is not interrupted.
 */
export function UtcClock() {
  const [time, setTime] = useState<string>(footer.clockPlaceholder);

  useEffect(() => {
    let timer = 0;
    const tick = (): void => {
      const now = new Date();
      setTime(formatUtcClock(now));
      timer = window.setTimeout(tick, 1000 - now.getMilliseconds());
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <p className="site-footer__clock type-meta" data-no-refresh="">
      <span className="site-footer__clock-label">{footer.clockLabel}</span>{' '}
      <span className="site-footer__clock-time" aria-live="off">
        {time}
      </span>
    </p>
  );
}
