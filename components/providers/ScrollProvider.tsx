'use client';

import { useEffect, type ReactNode } from 'react';
import { acts, type ActId } from '@/data/copy';
import { scheduleIdle } from '@/lib/scheduleIdle';
import type { LenisController } from '@/lib/lenis';
import { useMeridianStore } from '@/store';

export function ScrollProvider({ children }: { children: ReactNode }) {
  const reduced = useMeridianStore((state) => state.reducedMotion);
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void import('@/lib/gsap').then(({ ScrollTrigger }) => {
      if (cancelled) return;
      let controller: LenisController | null = null;
      let starting = false;
      const startLenis = () => {
        if (starting || disposed || reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        starting = true;
        void import('@/lib/lenis').then((module) => disposed ? null : module.createLenis(reduced)).then((next) => {
          if (disposed) { next?.destroy(); return; }
          controller = next;
          syncScrollLock();
          schedule();
        }).catch(() => { starting = false; });
      };
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
          ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
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
      const ignored = (node: Node | null): boolean => {
        const element = node instanceof Element ? node : node?.parentElement;
        return !!element?.closest('[data-no-refresh]');
      };
      const mutations = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === 'characterData') continue;
          if (ignored(record.target)) continue;
          schedule();
          return;
        }
      });
      mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-act'] });
      let fontTimer = 0;
      const fontRefresh = (): void => {
        window.clearTimeout(fontTimer);
        fontTimer = window.setTimeout(() => {
          if (!disposed) { schedule(); ScrollTrigger.refresh(); }
        }, 120);
      };
      window.addEventListener('resize', schedule);
      window.addEventListener('load', schedule);
      document.fonts.addEventListener('loadingdone', schedule);
      document.fonts.addEventListener('loadingdone', fontRefresh);
      void document.fonts.ready.then(fontRefresh);
      schedule();
      const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
      inputs.forEach((event) => window.addEventListener(event, startLenis, { passive: true }));
      const cancelIdle = scheduleIdle(startLenis);
      cleanup = () => {
        disposed = true;
        cancelIdle();
        inputs.forEach((event) => window.removeEventListener(event, startLenis));
        window.cancelAnimationFrame(frame);
        resize.disconnect();
        mutations.disconnect();
        locks.disconnect();
        document.removeEventListener('click', onNavClick);
        window.removeEventListener('resize', schedule);
        window.removeEventListener('load', schedule);
        document.fonts.removeEventListener('loadingdone', schedule);
        document.fonts.removeEventListener('loadingdone', fontRefresh);
        window.clearTimeout(fontTimer);
        trigger.kill();
        controller?.destroy();
      };
    }).catch(() => {});
    return () => { cancelled = true; cleanup?.(); };
  }, [reduced]);
  return children;
}
