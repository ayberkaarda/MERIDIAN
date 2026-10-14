import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { createPortal, useFrame } from '@react-three/fiber';
import { OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector4, type Mesh } from 'three';
import { technologies } from '@/data/technologies';
import { durations } from '@/lib/motion';
import { useMeridianStore } from '@/store';
import { createTechMaterial, TECH_STILL_TIME, techQuality } from '../materials/techMaterials';

/*
 * Single-canvas panel rendering (the drei View technique, done in place): the
 * panels live in their own off-graph scene and are drawn into the scissor
 * rectangle of the registered DOM panel, in the same WebGL context as the main
 * scene. A positive frame priority hands rendering to user code; without a
 * registered panel nothing here is mounted and R3F's automatic render resumes.
 *
 * Order per frame when the panel is on screen:
 *   1. clear the whole frame,
 *   2. draw the panel into its scissor rect; the quad writes depth at the near
 *      plane, so it occludes every depth-tested scene object behind it,
 *   3. draw the main scene without clearing; the high-tier grain/vignette
 *      overlay (depthTest off, drawn last) lands on top of the panel too, so
 *      the panel sits under the same finish on every tier.
 *
 * drei's <View> was tried first; inside this scene graph its portal camera and
 * render-loop takeover left the main scene undrawn, so the same scissor
 * technique is implemented here with explicit ordering.
 */
const RENDER_PASS = 1;
const PANEL_ORDER_CURRENT = 2;
const PANEL_ORDER_PREVIOUS = 1;

interface PanelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function TechnologyVisual() {
  const panel = useMeridianStore((state) => state.techPanel);
  return panel ? <TechnologyView panel={panel} /> : null;
}

/**
 * Caches the panel's viewport rect outside the frame loop: measured on
 * resize (ResizeObserver) and on passive scroll/resize events, never inside
 * useFrame, so rendering does not force layout.
 */
function usePanelRect(panel: HTMLElement): RefObject<PanelRect | null> {
  const rect = useRef<PanelRect | null>(null);
  useEffect(() => {
    const view = panel.ownerDocument.defaultView;
    const measure = (): void => {
      const bounds = panel.getBoundingClientRect();
      rect.current = { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    const options = { passive: true, capture: true } as const;
    view?.addEventListener('scroll', measure, options);
    view?.addEventListener('resize', measure, { passive: true });
    return () => {
      observer.disconnect();
      view?.removeEventListener('scroll', measure, options);
      view?.removeEventListener('resize', measure);
      rect.current = null;
    };
  }, [panel]);
  return rect;
}

function TechnologyView({ panel }: { panel: HTMLElement }) {
  const [panelScene] = useState(() => new Scene());
  // The quad writes clip space directly; this camera only satisfies the renderer.
  const [panelCamera] = useState(() => new OrthographicCamera(-1, 1, 1, -1, 0, 2));
  const [saved] = useState(() => ({ viewport: new Vector4(), scissor: new Vector4() }));
  const aspect = useRef(1);
  const rect = usePanelRect(panel);

  useFrame(({ gl, scene, camera, size }) => {
    const bounds = rect.current;
    const onScreen =
      bounds !== null &&
      bounds.width >= 1 &&
      bounds.height >= 1 &&
      bounds.top + bounds.height > 0 &&
      bounds.left + bounds.width > 0 &&
      bounds.top < size.height &&
      bounds.left < size.width;
    if (!onScreen) {
      // Panel off screen: no panel pass at all, just the main scene.
      gl.render(scene, camera);
      return;
    }

    aspect.current = bounds.width / bounds.height;
    const autoClear = gl.autoClear;
    const scissorTest = gl.getScissorTest();
    gl.getViewport(saved.viewport);
    gl.getScissor(saved.scissor);
    try {
      gl.autoClear = false;
      gl.clear();
      const bottom = size.height - (bounds.top + bounds.height);
      gl.setViewport(bounds.left, bottom, bounds.width, bounds.height);
      gl.setScissor(bounds.left, bottom, bounds.width, bounds.height);
      gl.setScissorTest(true);
      gl.render(panelScene, panelCamera);
      gl.setScissorTest(scissorTest);
      gl.setScissor(saved.scissor);
      gl.setViewport(saved.viewport);
      gl.render(scene, camera);
    } finally {
      gl.setScissorTest(scissorTest);
      gl.setScissor(saved.scissor);
      gl.setViewport(saved.viewport);
      gl.autoClear = autoClear;
    }
  }, RENDER_PASS);

  return createPortal(<TechnologyPanels aspect={aspect} />, panelScene);
}

interface Transition {
  current: number;
  previous: number;
  progress: number;
}

function TechnologyPanels({ aspect: panelAspect }: { aspect: RefObject<number> }) {
  const tier = useMeridianStore((state) => state.tier);
  const quality = techQuality[tier];
  const materials = useMemo(() => technologies.map((item) => createTechMaterial(item.visual, quality)), [quality]);
  const geometry = useMemo(() => new PlaneGeometry(2, 2), []);
  const meshes = useRef<(Mesh | null)[]>([]);
  const transition = useRef<Transition>({ current: -1, previous: -1, progress: 1 });
  const clock = useRef(TECH_STILL_TIME);

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const meshRefs = useMemo(
    () => technologies.map((_, index) => (mesh: Mesh | null) => { meshes.current[index] = mesh; }),
    [],
  );

  useFrame((_, delta) => {
    const store = useMeridianStore.getState();
    const step = Math.min(delta, 0.1);
    const swap = transition.current;
    const next = Math.min(technologies.length - 1, Math.max(0, Math.trunc(store.activeTech)));

    if (swap.current === -1) {
      swap.current = next;
      swap.progress = 1;
    } else if (next !== swap.current) {
      swap.previous = swap.current;
      swap.current = next;
      // The DOM shutter wipe (duration m) carries the transition and covers the
      // panel while it commits, so the shader swaps instantly behind it. Only
      // reduced motion, where the DOM crossfades, blends here over m as well.
      // Low tier never animates uniforms.
      swap.progress = quality.animated && store.reducedMotion ? 0 : 1;
    }
    if (swap.progress < 1) swap.progress = Math.min(1, swap.progress + step / durations.m);

    // Reduced motion freezes every field.
    const running = quality.animated && !store.reducedMotion;
    if (running) clock.current += step;
    const aspect = panelAspect.current;

    for (let index = 0; index < technologies.length; index += 1) {
      const mesh = meshes.current[index];
      const material = mesh?.material;
      if (!mesh || !(material instanceof ShaderMaterial)) continue;
      const isCurrent = index === swap.current;
      const visible = isCurrent || (index === swap.previous && swap.progress < 1);
      mesh.visible = visible;
      if (!visible) continue;
      mesh.renderOrder = isCurrent ? PANEL_ORDER_CURRENT : PANEL_ORDER_PREVIOUS;
      const { uAspect, uTime, uReveal } = material.uniforms;
      if (uAspect && uAspect.value !== aspect) uAspect.value = aspect;
      if (!quality.animated) continue;
      if (uTime && running) uTime.value = clock.current;
      if (uReveal) uReveal.value = isCurrent ? swap.progress : 1;
    }
  });

  return (
    <>
      {materials.map((material, index) => (
        <mesh
          key={technologies[index]?.id ?? index}
          ref={meshRefs[index]}
          geometry={geometry}
          material={material}
          frustumCulled={false}
          visible={false}
        />
      ))}
    </>
  );
}
