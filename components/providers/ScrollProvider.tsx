'use client';

import { useEffect, type ReactNode } from 'react';
import { acts, type ActId } from '@/data/copy';
import { ScrollTrigger } from '@/lib/gsap';
import { createLenis } from '@/lib/lenis';
import { useMeridianStore } from '@/store';

export function ScrollProvider({ children }: { children: ReactNode }) {
  const reduced = useMeridianStore((state) => state.reducedMotion);
  useEffect(() => {
    const controller = createLenis(reduced);
    const html = document.documentElement;
    let pendingTarget: HTMLElement | null = null;
    const focusTarget = (target: HTMLElement): void => {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    const syncScrollLock = (): void => {

      if (html.hasAttribute('data-loading') || html.hasAttribute('data-menu')) {
        controller?.lenis.stop();
      } else {
        controller?.lenis.start();
        if (pendingTarget) {
          const target = pendingTarget;
          if (controller) controller.lenis.scrollTo(target, { onComplete: () => focusTarget(target) });
          else {
            target.scrollIntoView({ behavior: 'instant' });
            focusTarget(target);
          }
          pendingTarget = null;
        }
      }
    };
    const locks = new MutationObserver(syncScrollLock);
    {
      locks.observe(html, { attributes: true, attributeFilter: ['data-loading', 'data-menu'] });
      syncScrollLock();
    }
    const onNavClick = (event: MouseEvent): void => {
      if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('.nav-overlay a[href^="#"], .site-header a[href^="#"]')
        : null;
      if (!anchor || anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self') || anchor.getAttribute('aria-disabled') === 'true') return;
      const hash = anchor.getAttribute('href');
      if (!hash || hash.length < 2) return;
      let id: string;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        return;
      }
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      if (window.location.hash === hash) window.history.replaceState(null, '', hash);
      else window.history.pushState(null, '', hash);
      pendingTarget = target;
      syncScrollLock();
    };
    document.addEventListener('click', onNavClick);
    let boundaries: { top: number; act: ActId }[] = [];
    let distance = 1;
    let focusOffset = 0;
    let frame = 0;
    let disposed = false;
    const publish = (progress: number, scroll: number): void => {
      let activeAct: ActId = 'departure';
      for (const boundary of boundaries) {
        if (boundary.top > scroll + focusOffset) break;
        activeAct = boundary.act;
      }
      const state = useMeridianStore.getState();
      if (state.scrollProgress !== progress || state.activeAct !== activeAct) {
        useMeridianStore.setState({ scrollProgress: progress, activeAct });
      }
    };
    const trigger = ScrollTrigger.create({
      start: 0,
      end: () => distance,
      onUpdate: (self) => publish(self.progress, self.progress * distance),
    });
    const measure = (): void => {
      frame = 0;
      if (disposed) return;
      const scroll = window.scrollY;
      focusOffset = window.innerHeight * 0.5;
      distance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      boundaries = Array.from(document.querySelectorAll<HTMLElement>('[data-act]')).flatMap((element) => {
        const act = acts.find((candidate) => candidate.id === element.dataset.act)?.id;
        return act ? [{ top: element.getBoundingClientRect().top + scroll, act }] : [];
      }).sort((a, b) => a.top - b.top);
      controller?.lenis.resize();
      trigger.refresh();
      publish(trigger.progress, trigger.scroll());
    };
    const schedule = (): void => {
      if (!frame && !disposed) frame = window.requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(document.documentElement);
    resize.observe(document.body);
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-act'] });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    document.fonts.addEventListener('loadingdone', schedule);
    schedule();
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      locks.disconnect();
      document.removeEventListener('click', onNavClick);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('load', schedule);
      document.fonts.removeEventListener('loadingdone', schedule);
      trigger.kill();
      controller?.destroy();
    };
  }, [reduced]);
  return children;
}
