import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { createPortal, useFrame } from '@react-three/fiber';
import { PlaneGeometry, Scene, ShaderMaterial, type Mesh } from 'three';
import { technologies } from '@/data/technologies';
import { durations } from '@/lib/motion';
import { useMeridianStore } from '@/store';
import { createTechMaterial, TECH_STILL_TIME, techQuality } from '../materials/techMaterials';
import { PanelPass, usePanelLayer } from '../panels/PanelPass';

/*
 * The four technology fields share one off-graph scene, drawn by the shared
 * panel pass into the rect of the registered DOM panel (see panels/PanelPass).
 * Without a registered panel nothing here is mounted.
 */
const PANEL_ORDER_CURRENT = 2;
const PANEL_ORDER_PREVIOUS = 1;

export function TechnologyVisual() {
  const panel = useMeridianStore((state) => state.techPanel);
  return panel ? <TechnologyView panel={panel} /> : null;
}

function TechnologyView({ panel }: { panel: HTMLElement }) {
  const [panelScene] = useState(() => new Scene());
  const aspect = useRef(1);
  const [layerOptions] = useState(() => ({
    onDraw: (width: number, height: number) => {
      aspect.current = width / height;
    },
  }));
  usePanelLayer(panel, panelScene, layerOptions);

  return (
    <>
      <PanelPass />
      {createPortal(<TechnologyPanels aspect={aspect} />, panelScene)}
    </>
  );
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
