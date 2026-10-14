'use client';

import { useSyncExternalStore } from 'react';
import { useMeridianStore } from '@/store';

/*
 * Shader panels (technology, stories) are windows onto the shared scene. A
 * static gradient stands in where a WebGL2 context cannot be created at all,
 * and until the panel pass has drawn; every tier with WebGL (low included,
 * with static uniforms) then draws through the panel.
 */
let webglSupport: boolean | undefined;
const probeWebgl = (): boolean => {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2');
      webglSupport = context !== null;
      context?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
};

const subscribeNever = (): (() => void) => () => undefined;
const needsFallbackOnClient = (): boolean => !probeWebgl();
const needsFallbackOnServer = (): boolean => true;

/**
 * True when a panel must paint its own static gradient instead of the scene:
 * without WebGL2, and until the shared panel pass has drawn its first frame
 * (server render, first paint and a slow scene chunk included).
 */
export function usePanelFallback(): boolean {
  const unsupported = useSyncExternalStore(subscribeNever, needsFallbackOnClient, needsFallbackOnServer);
  const panelsReady = useMeridianStore((state) => state.panelsReady);
  return unsupported || !panelsReady;
}
