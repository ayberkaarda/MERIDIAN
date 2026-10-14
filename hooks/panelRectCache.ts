/**
 * Viewport rectangles of the DOM panels the scene draws into.
 *
 * The DOM side measures; the canvas only reads the cache through
 * `readPanelBounds`. Elements are marked dirty by passive scroll/resize
 * events (all panels), a ResizeObserver and a MutationObserver on the
 * element's and its parent's style/class (transform and clip-path tweens write
 * inline styles). One requestAnimationFrame flush per frame measures each
 * dirty element exactly once; no layout is read anywhere else.
 *
 * The flush loop keeps running while the bridge is started. Started before the
 * canvas, its callback is queued ahead of the render loop in every frame, so a
 * scroll or tween is measured in the same frame it is drawn.
 *
 * `clip` is the part of the panel left visible by an `inset()` or `polygon()`
 * clip-path on the element and by a parent with clipping overflow. Shaders
 * still fill the full transformed rect; the clip only narrows the scissor, so
 * a DOM clip-path reveal and a DOM scale stay in register with the image.
 */
export interface PanelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PanelBounds extends PanelRect {
  clip: PanelRect;
}

interface Entry {
  bounds: PanelBounds | null;
  mutations: MutationObserver;
}

const entries = new Map<HTMLElement, Entry>();
const dirty = new Set<HTMLElement>();
let resizeObserver: ResizeObserver | null = null;
let view: Window | null = null;
let frame = 0;

const scrollOptions: AddEventListenerOptions = { passive: true, capture: true };
const resizeOptions: AddEventListenerOptions = { passive: true };

/** Latest cached bounds of a tracked panel, or null. Never reads layout. */
export function readPanelBounds(element: HTMLElement): PanelBounds | null {
  return entries.get(element)?.bounds ?? null;
}

function markAll(): void {
  entries.forEach((_, element) => dirty.add(element));
}

function flush(): void {
  frame = view ? view.requestAnimationFrame(flush) : 0;
  if (dirty.size === 0) return;
  dirty.forEach((element) => {
    const entry = entries.get(element);
    if (entry) entry.bounds = measure(element);
  });
  dirty.clear();
}

function track(element: HTMLElement): void {
  if (entries.has(element)) return;
  const mutations = new MutationObserver(() => dirty.add(element));
  const filter = { attributes: true, attributeFilter: ['style', 'class'] };
  mutations.observe(element, filter);
  if (element.parentElement) mutations.observe(element.parentElement, filter);
  entries.set(element, { bounds: null, mutations });
  resizeObserver?.observe(element);
  dirty.add(element);
}

function untrack(element: HTMLElement): void {
  const entry = entries.get(element);
  if (!entry) return;
  entry.mutations.disconnect();
  resizeObserver?.unobserve(element);
  entries.delete(element);
  dirty.delete(element);
}

/** Replaces the tracked set with `elements`. */
export function setTrackedPanels(elements: readonly HTMLElement[]): void {
  const next = new Set(elements);
  entries.forEach((_, element) => {
    if (!next.has(element)) untrack(element);
  });
  next.forEach(track);
}

/** Starts the observers and the flush loop; returns the stop function. */
export function startPanelRectBridge(target: Window): () => void {
  view = target;
  resizeObserver = new ResizeObserver((records) => {
    for (const record of records) {
      if (record.target instanceof HTMLElement) dirty.add(record.target);
    }
  });
  entries.forEach((_, element) => resizeObserver?.observe(element));
  target.addEventListener('scroll', markAll, scrollOptions);
  target.addEventListener('resize', markAll, resizeOptions);
  frame = target.requestAnimationFrame(flush);
  return () => {
    target.cancelAnimationFrame(frame);
    frame = 0;
    target.removeEventListener('scroll', markAll, { capture: true });
    target.removeEventListener('resize', markAll);
    setTrackedPanels([]);
    resizeObserver?.disconnect();
    resizeObserver = null;
    view = null;
  };
}

function intersect(a: PanelRect, b: PanelRect): PanelRect {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.left + a.width, b.left + b.width);
  const bottom = Math.min(a.top + a.height, b.top + b.height);
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

function measure(element: HTMLElement): PanelBounds {
  const owner = element.ownerDocument.defaultView;
  const box = element.getBoundingClientRect();
  const rect: PanelRect = { left: box.left, top: box.top, width: box.width, height: box.height };
  const style = owner?.getComputedStyle(element);
  let clip = (style ? parseClip(style.clipPath, rect, element.offsetWidth, element.offsetHeight) : null) ?? rect;
  // A panel scaled up inside a clipping frame is cut by the frame's box.
  const parent = element.parentElement;
  const parentStyle = parent ? owner?.getComputedStyle(parent) : undefined;
  if (parent && parentStyle && (parentStyle.overflowX !== 'visible' || parentStyle.overflowY !== 'visible')) {
    const outer = parent.getBoundingClientRect();
    clip = intersect(clip, { left: outer.left, top: outer.top, width: outer.width, height: outer.height });
  }
  return { ...rect, clip };
}

/* ---------------------------------------------------------------------------
 * clip-path parsing. Only the shapes that describe rectangular reveals are
 * honoured: inset() exactly, polygon() by its bounding box. Anything else
 * (circle, path, calc() lengths) keeps the full rect.
 */

// `reference` is the transformed size for percentages; `scale` maps layout
// pixels to viewport pixels under the element's transform.
function parseLength(token: string, reference: number, scale: number): number | null {
  const value = Number.parseFloat(token);
  if (!Number.isFinite(value)) return null;
  if (token.endsWith('%')) return (value / 100) * reference;
  if (token.endsWith('px')) return value * scale;
  // A unitless zero is the only valid unitless length.
  return value === 0 ? 0 : null;
}

function parseClip(clipPath: string, rect: PanelRect, layoutWidth: number, layoutHeight: number): PanelRect | null {
  if (!clipPath || clipPath === 'none' || clipPath.includes('calc(')) return null;
  const scaleX = layoutWidth > 0 ? rect.width / layoutWidth : 1;
  const scaleY = layoutHeight > 0 ? rect.height / layoutHeight : 1;

  const inset = /inset\(([^)]*)\)/.exec(clipPath);
  if (inset?.[1] !== undefined) {
    const tokens = (inset[1].split(/\s+round\s+/)[0] ?? '').trim().split(/\s+/);
    const first = tokens[0];
    if (first === undefined || first === '' || tokens.length > 4) return null;
    // CSS shorthand expansion: top [right [bottom [left]]].
    const rightToken = tokens[1] ?? first;
    const bottomToken = tokens[2] ?? first;
    const leftToken = tokens[3] ?? rightToken;
    const top = parseLength(first, rect.height, scaleY);
    const right = parseLength(rightToken, rect.width, scaleX);
    const bottom = parseLength(bottomToken, rect.height, scaleY);
    const left = parseLength(leftToken, rect.width, scaleX);
    if (top === null || right === null || bottom === null || left === null) return null;
    return {
      left: rect.left + left,
      top: rect.top + top,
      width: Math.max(0, rect.width - left - right),
      height: Math.max(0, rect.height - top - bottom),
    };
  }

  const polygon = /polygon\(([^)]*)\)/.exec(clipPath);
  if (polygon?.[1] !== undefined) {
    const points = polygon[1].replace(/^\s*(nonzero|evenodd)\s*,/, '').split(',');
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const point of points) {
      const [xToken, yToken] = point.trim().split(/\s+/);
      if (xToken === undefined || yToken === undefined) return null;
      const x = parseLength(xToken, rect.width, scaleX);
      const y = parseLength(yToken, rect.height, scaleY);
      if (x === null || y === null) return null;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
    const left = Math.max(0, minX);
    const top = Math.max(0, minY);
    return {
      left: rect.left + left,
      top: rect.top + top,
      width: Math.max(0, Math.min(rect.width, maxX) - left),
      height: Math.max(0, Math.min(rect.height, maxY) - top),
    };
  }

  return null;
}
