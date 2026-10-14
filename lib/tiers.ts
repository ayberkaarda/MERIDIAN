export type DeviceTier = 'high' | 'mid' | 'low';
export interface DeviceSignals {
  dpr: number;
  cores: number;
  memory: number | null;
  coarsePointer: boolean;
  benchmarkFps?: number;
}
export const tierSettings = {
  high: { maxDpr: 2, postprocessing: true, particleMultiplier: 1, animatedPanels: true, cameraKeyframes: 'full', autonomousOrbit: false },
  mid: { maxDpr: 1.5, postprocessing: false, particleMultiplier: 0.5, animatedPanels: true, cameraKeyframes: 'full', autonomousOrbit: false },
  low: { maxDpr: 1, postprocessing: false, particleMultiplier: 0.5, animatedPanels: false, cameraKeyframes: 'two', autonomousOrbit: true },
} as const;

export function getTierOverride(search: string): DeviceTier | null {
  const tier = new URLSearchParams(search).get('tier');
  return tier === 'high' || tier === 'mid' || tier === 'low' ? tier : null;
}

export function classifyDeviceTier(signals: DeviceSignals): DeviceTier {
  if (signals.coarsePointer || signals.cores <= 2 || (signals.memory !== null && signals.memory <= 2) || (signals.benchmarkFps !== undefined && signals.benchmarkFps < 45)) return 'low';
  if (signals.dpr > 2 || signals.cores < 8 || (signals.memory !== null && signals.memory < 8) || (signals.benchmarkFps !== undefined && signals.benchmarkFps < 60)) return 'mid';
  return 'high';
}

export function benchmarkWebGL(duration = 200): Promise<number> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const gl = canvas.getContext('webgl', { antialias: false, depth: false });
    if (!gl) { resolve(0); return; }
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    const vertex = gl.createShader(gl.VERTEX_SHADER);
    const fragment = gl.createShader(gl.FRAGMENT_SHADER);
    const cleanup = (): void => {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    if (!program || !buffer || !vertex || !fragment) { cleanup(); resolve(0); return; }
    gl.shaderSource(vertex, 'attribute vec2 position; void main(){gl_Position=vec4(position,0.0,1.0);}');
    gl.shaderSource(fragment, 'precision mediump float; void main(){vec2 p=gl_FragCoord.xy/256.0; float v=0.0; for(int i=0;i<32;i++){p=sin(p.yx*1.7+float(i));v+=dot(p,p);} gl_FragColor=vec4(vec3(v/64.0),1.0);}');
    gl.compileShader(vertex);
    gl.compileShader(fragment);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { cleanup(); resolve(0); return; }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, 256, 256);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
    const started = performance.now();
    let gpuTime = 0;
    let samples = 0;
    let finished = false;
    let frame = 0;
    const finish = (): void => {
      if (finished) return;
      finished = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', visibility);
      cleanup();
      resolve(samples === 0 ? 0 : 1000 / Math.max(0.1, gpuTime / samples));
    };
    const visibility = (): void => { if (document.hidden) finish(); };
    const sample = (): void => {
      if (finished) return;
      const before = performance.now();
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.finish();
      gpuTime += performance.now() - before;
      samples += 1;
      if (gl.isContextLost() || performance.now() - started >= duration) finish();
      else frame = window.requestAnimationFrame(sample);
    };
    const timeout = window.setTimeout(finish, duration);
    document.addEventListener('visibilitychange', visibility);
    frame = window.requestAnimationFrame(sample);
  });
}

export async function detectDeviceTier(): Promise<DeviceTier> {
  if (typeof window === 'undefined') return 'low';
  const override = getTierOverride(window.location.search);
  if (override) return override;
  const device = navigator as Navigator & { deviceMemory?: number };
  const benchmarkFps = await benchmarkWebGL(200);
  return classifyDeviceTier({ dpr: window.devicePixelRatio || 1, cores: device.hardwareConcurrency || 2, memory: device.deviceMemory ?? null, coarsePointer: window.matchMedia('(pointer: coarse)').matches, benchmarkFps });
}
