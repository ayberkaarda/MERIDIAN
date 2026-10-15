import { useLayoutEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, Vector4, type Scene, type WebGLRenderer } from 'three';
import { readPanelBounds } from '@/hooks/panelRectCache';
import { useMeridianStore } from '@/store';
import { setAnimating } from '../frameDemand';

/*
 * Single-canvas panel rendering (the drei View technique, done in place).
 * Every DOM-anchored panel visual owns a small off-graph scene; one pass draws
 * each of those scenes into the scissor rectangle of its DOM panel, in the
 * same WebGL context as the main scene. A positive frame priority hands
 * rendering to user code; while no panel visual is mounted nothing here
 * subscribes and R3F's automatic render resumes.
 *
 * Order per frame when at least one panel is on screen:
 *   1. clear the whole frame,
 *   2. draw every visible panel into its rect; the quads write depth at the
 *      near plane, so they occlude every depth-tested scene object behind them,
 *   3. draw the main scene without clearing; the high-tier grain/vignette
 *      overlay (depthTest off, drawn last) lands on top of the panels too, so
 *      the panels sit under the same finish on every tier.
 *
 * Several visuals may each mount a <PanelPass />; they elect one host per
 * renderer and only the host draws, so the frame is still rendered once.
 *
 * Panel rects come from the DOM-side cache (hooks/panelRectCache, filled by
 * hooks/PanelRectBridge); nothing here measures layout. After the first frame that draws a panel the store's
 * panelsReady flag is set; it is cleared on a failed frame or when the last
 * pass unmounts.
 */
export const PANEL_PASS_PRIORITY = 1;
const ANIMATION_KEY = 'panels';

export interface PanelLayerOptions {
  /** Draw order between panels; lower draws first. */
  order?: number;
  /** Runs right before the layer draws, with the panel size in CSS pixels. */
  onDraw?: (width: number, height: number) => void;
}

interface PanelLayer {
  scene: Scene;
  element: HTMLElement;
  options: { current: PanelLayerOptions };
}

interface PanelRegistry {
  layers: PanelLayer[];
  hosts: symbol[];
  /** Whether panelsReady has been reported for the current hosts. */
  ready: boolean;
}

const registries = new WeakMap<WebGLRenderer, PanelRegistry>();

function getRegistry(gl: WebGLRenderer): PanelRegistry {
  let registry = registries.get(gl);
  if (!registry) {
    registry = { layers: [], hosts: [], ready: false };
    registries.set(gl, registry);
  }
  return registry;
}

// Panels are reported ready once, after the first frame that drew one.
function setReady(registry: PanelRegistry, ready: boolean): void {
  registry.ready = ready;
  useMeridianStore.getState().setPanelsReady(ready);
}

function byOrder(a: PanelLayer, b: PanelLayer): number {
  return (a.options.current.order ?? 0) - (b.options.current.order ?? 0);
}

function remove<T>(list: T[], item: T): void {
  const index = list.indexOf(item);
  if (index !== -1) list.splice(index, 1);
}

/**
 * Registers `scene` to be drawn into `element`'s viewport rect by the shared
 * pass. The caller must also mount a <PanelPass />.
 */
export function usePanelLayer(element: HTMLElement, scene: Scene, options: PanelLayerOptions = {}): void {
  const gl = useThree((state) => state.gl);
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });
  useLayoutEffect(() => {
    const registry = getRegistry(gl);
    const layer: PanelLayer = { scene, element, options: latest };
    registry.layers.push(layer);
    return () => {
      remove(registry.layers, layer);
    };
  }, [gl, element, scene]);
}

export function PanelPass() {
  const gl = useThree((state) => state.gl);
  const [token] = useState(() => Symbol('panel-pass'));
  // The quads write clip space directly; this camera only satisfies the renderer.
  const [panelCamera] = useState(() => new OrthographicCamera(-1, 1, 1, -1, 0, 2));
  const [saved] = useState(() => ({ viewport: new Vector4(), scissor: new Vector4() }));
  const visible = useRef<PanelLayer[]>([]);

  useLayoutEffect(() => {
    const registry = getRegistry(gl);
    registry.hosts.push(token);
    return () => {
      remove(registry.hosts, token);
      if (registry.hosts.length === 0) {
        setReady(registry, false);
        setAnimating(ANIMATION_KEY, false);
      }
    };
  }, [gl, token]);

  useFrame(({ gl: renderer, scene, camera, size }) => {
    const registry = getRegistry(renderer);
    if (registry.hosts[0] !== token) return;

    const drawn = visible.current;
    drawn.length = 0;
    for (const layer of registry.layers) {
      const bounds = readPanelBounds(layer.element);
      if (bounds === null || bounds.width < 1 || bounds.height < 1) continue;
      const { clip } = bounds;
      const onScreen =
        clip.width >= 1 &&
        clip.height >= 1 &&
        clip.top + clip.height > 0 &&
        clip.left + clip.width > 0 &&
        clip.top < size.height &&
        clip.left < size.width;
      if (onScreen) drawn.push(layer);
    }
    // On-screen panels follow DOM tweens (scale, clip-path) and animated
    // uniforms, which no store change announces; under reduced motion both
    // are still and scroll alone moves them.
    setAnimating(ANIMATION_KEY, drawn.length > 0 && !useMeridianStore.getState().reducedMotion);
    if (drawn.length === 0) {
      // Every panel off screen or fully clipped: just the main scene.
      renderer.render(scene, camera);
      return;
    }
    if (drawn.length > 1) drawn.sort(byOrder);

    const autoClear = renderer.autoClear;
    const scissorTest = renderer.getScissorTest();
    renderer.getViewport(saved.viewport);
    renderer.getScissor(saved.scissor);
    try {
      renderer.autoClear = false;
      renderer.clear();
      renderer.setScissorTest(true);
      for (const layer of drawn) {
        const bounds = readPanelBounds(layer.element);
        if (bounds === null) continue;
        const { clip } = bounds;
        // The viewport spans the whole transformed panel so the shader fills
        // it; the scissor narrows to the visible (clip-path) part on screen.
        const left = Math.max(0, clip.left);
        const top = Math.max(0, clip.top);
        const right = Math.min(size.width, clip.left + clip.width);
        const bottom = Math.min(size.height, clip.top + clip.height);
        renderer.setViewport(bounds.left, size.height - (bounds.top + bounds.height), bounds.width, bounds.height);
        renderer.setScissor(left, size.height - bottom, right - left, bottom - top);
        layer.options.current.onDraw?.(bounds.width, bounds.height);
        renderer.render(layer.scene, panelCamera);
      }
      renderer.setScissorTest(scissorTest);
      renderer.setScissor(saved.scissor);
      renderer.setViewport(saved.viewport);
      renderer.render(scene, camera);
      if (!registry.ready) setReady(registry, true);
    } catch (error) {
      setReady(registry, false);
      throw error;
    } finally {
      renderer.setScissorTest(scissorTest);
      renderer.setScissor(saved.scissor);
      renderer.setViewport(saved.viewport);
      renderer.autoClear = autoClear;
      drawn.length = 0;
    }
  }, PANEL_PASS_PRIORITY);

  return null;
}
