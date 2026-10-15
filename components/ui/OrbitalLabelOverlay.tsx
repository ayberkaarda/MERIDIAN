'use client';

import { useLayoutEffect, useRef } from 'react';
import { copy } from '@/data/copy';
import { useMeridianStore } from '@/store';

/** DOM labels subscribe imperatively so projected anchors never rerender React. */
function Labels() {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const elements = Array.from(root.current?.querySelectorAll<HTMLSpanElement>('[data-orbit-label]') ?? []);
    const labels = elements.map((element) => ({ element, width: 0, height: 0, x: NaN, y: NaN, nextX: 0, nextY: 0, opacity: -1 }));
    const ordered = labels.slice();
    const draw = (): void => {
      const state = useMeridianStore.getState();
      labels.forEach((item, index) => {
        const point = state.orbitalLabelPoints[index];
        if (!point) return;
        const opacity = point.visible ? state.orbitalLabelOpacity : 0;
        if (opacity !== item.opacity) {
          item.element.style.opacity = String(opacity);
          item.element.style.visibility = opacity > 0 ? 'visible' : 'hidden';
          item.opacity = opacity;
        }
        if (!opacity) return;
        const rightInset = state.orbitalViewport.width >= 768 ? 216 : 16;
        item.nextX = Math.round(Math.max(16, Math.min(state.orbitalViewport.width - rightInset - item.width, point.x)));
        item.nextY = Math.round(Math.max(160 + item.height / 2, Math.min(state.orbitalViewport.height - 24 - item.height / 2, point.y)));
      });
      ordered.sort((a, b) => a.nextY - b.nextY);
      for (let index = 0; index < ordered.length; index += 1) {
        const item = ordered[index]!;
        if (!item.opacity) continue;
        for (let previous = 0; previous < index; previous += 1) {
          const other = ordered[previous]!;
          if (!other.opacity || item.nextX >= other.nextX + other.width + 8 || other.nextX >= item.nextX + item.width + 8) continue;
          item.nextY = Math.max(item.nextY, other.nextY + (other.height + item.height) / 2 + 8);
        }
      }
      // Pack upward at the bottom edge without collapsing labels onto each other.
      for (let index = ordered.length - 1; index >= 0; index -= 1) {
        const item = ordered[index]!;
        if (!item.opacity) continue;
        item.nextY = Math.min(item.nextY, state.orbitalViewport.height - 24 - item.height / 2);
        for (let next = index + 1; next < ordered.length; next += 1) {
          const other = ordered[next]!;
          if (!other.opacity || item.nextX >= other.nextX + other.width + 8 || other.nextX >= item.nextX + item.width + 8) continue;
          item.nextY = Math.min(item.nextY, other.nextY - (other.height + item.height) / 2 - 8);
        }
      }
      labels.forEach((item) => {
        if (!item.opacity) return;
        const x = item.nextX;
        const y = Math.round(item.nextY);
        if (x === item.x && y === item.y) return;
        item.x = x; item.y = y;
        item.element.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0) translateY(-50%)';
      });
    };
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const item = labels.find((candidate) => candidate.element === entry.target);
        if (!item) continue;
        const box = entry.borderBoxSize?.[0];
        item.width = box?.inlineSize ?? entry.contentRect.width;
        item.height = box?.blockSize ?? entry.contentRect.height;
      }
      draw();
    });
    labels.forEach(({ element }) => observer.observe(element));
    const unsubscribe = useMeridianStore.subscribe(draw);
    draw();
    return () => { observer.disconnect(); unsubscribe(); };
  }, []);
  return <div ref={root} aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    {copy.orbitalSystem.labels.map((text) => <span key={text} data-orbit-label="" style={{ position: 'absolute', top: 0, left: 0, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-geist-mono), monospace', fontSize: 'var(--font-meta-size, 11px)', letterSpacing: 'var(--font-meta-tracking, 0.12em)', textTransform: 'uppercase', lineHeight: 1, color: 'var(--muted)', whiteSpace: 'nowrap', opacity: 0, visibility: 'hidden', userSelect: 'none', willChange: 'transform' }}>
      <span style={{ display: 'block', width: 16, height: 1, background: 'currentColor', opacity: 0.6 }} />{text}
    </span>)}
  </div>;
}

export function OrbitalLabelOverlay() {
  const active = useMeridianStore((state) => state.activeAct === 'transit');
  return active ? <Labels /> : null;
}
