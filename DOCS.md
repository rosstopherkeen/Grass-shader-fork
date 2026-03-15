# Grass Shader — Documentation

## Quick Start

```bash
npm install
npm run dev        # or: npm start
```

Vite will print:

```
VITE vX.X.X  ready in XXXms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/   ← open this on a phone (same WiFi) for real-device testing
```

Other scripts:

| Command | Purpose |
|---|---|
| `npm run build` | Production bundle → `dist/` |
| `npm run preview` | Serve production build locally |

---

## Configurable Variables

### Scene-level props (set in `App.js` on `<Grass>`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `instances` | `number` | `50000` | Total grass blade count. Automatically capped to `12000` on mobile. Reduce for performance; geometry data is recomputed when this changes. |
| `width` | `number` | `100` | Side length of the square ground plane in world units. Also controls blade scatter area. Recomputes geometry when changed. |
| `options.bW` | `number` | `0.12` | Blade width at the base (world units). |
| `options.bH` | `number` | `1` | Blade height reference (world units). **Must match the `bladeHeight` uniform** in `GrassMaterial.js`. |
| `options.joints` | `number` | `5` | Deformation segments per blade. Higher = smoother bend animation; lower = better performance on low-end GPU. |

### Canvas-level (set in `App.js` on `<Canvas>`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `dpr` | `[min, max]` | `[1, 1.5]` | Device pixel ratio range. A Retina display would normally render at DPR 2–3; capping at 1.5 halves the fill-rate cost. Raise to `[1, 2]` for sharper desktop. |
| `performance.min` | `number` | `0.5` | Minimum DPR fraction that `AdaptiveDpr` will fall back to when FPS is low (0.5 = half the cap). Combined with `<AdaptiveDpr pixelated />` this auto-scales quality under load. |

### Grass placement constants (in `Grass.js` → `getAttributeData()`)

| Constant | Default | Description |
|---|---|---|
| `min` | `-0.25` | Minimum random tilt angle (radians) for blade growth around X and Z axes. |
| `max` | `0.25` | Maximum random tilt angle (radians). Widen this range for more chaotic, windswept grass. |
| Mobile cap | `12000` | `effectiveInstances` ceiling on mobile (detected via UA string + `window.innerWidth < 768`). Edit in `useIsMobile()`. |

### GrassMaterial uniforms (in `GrassMaterial.js`)

These are shader-level and can be changed at runtime via `materialRef.current.uniforms`.

| Uniform | Type | Default | Description |
|---|---|---|---|
| `bladeHeight` | `float` | `1` | Blade height used to compute `frc` (vertex fraction along blade, 0 = root → 1 = tip). Keep in sync with `options.bH`. |
| `time` | `float` | auto | Driven by `state.clock.elapsedTime / 4` each frame. **Dividing by 4 slows wind speed 4×.** Change the divisor in `Grass.js → useFrame` to speed up or slow down wind. |
| `tipColor` | `vec3 (Color)` | `rgb(0, 0.6, 0)` | Colour at the blade tip. Blended with the diffuse texture. |
| `bottomColor` | `vec3 (Color)` | `rgb(0, 0.1, 0)` | Colour at the blade root, creating a ground-shadow effect. |
| `map` | `sampler2D` | `blade_diffuse.jpg` | Diffuse/colour texture for blade surface. |
| `alphaMap` | `sampler2D` | `blade_alpha.jpg` | Alpha mask. Pixels below `0.15` red-channel value are discarded (`discard` in fragment shader). |

### Hardcoded shader constants (in `GrassMaterial.js` vertex shader)

These require editing the GLSL string directly.

| Location | Value | Effect |
|---|---|---|
| `float halfAngle = noise * 0.15` | `0.15` | Wind sway amplitude. Increase for dramatic bending; decrease for calmer grass. |
| `snoise(vec2(time - offset.x/50.0, time - offset.z/50.0))` | `/50.0` | Wind spatial frequency. Lower divisor = tighter, patchier gusts. |

### Ground terrain constants (in `Grass.js → getYPosition()`)

| Expression | Scale | Effect |
|---|---|---|
| `2 * noise2D(x/50, z/50)` | ±2 units | Medium rolling hills |
| `4 * noise2D(x/100, z/100)` | ±4 units | Large-scale terrain elevation |
| `0.2 * noise2D(x/10, z/10)` | ±0.2 units | Fine surface detail |

---

## Lighting

The scene has three light sources. Understanding which affects what is important because the grass shader is custom GLSL and **bypasses Three.js's normal lighting system**.

### `<ambientLight />`
- **Default:** white, intensity `1`
- Provides flat, directionless global illumination.
- **Affects:** the ground mesh (`<meshStandardMaterial>`) only.
- **Does not affect grass blades** — the grass shader is unlit GLSL.
- To adjust: `<ambientLight intensity={0.4} color="#ccddcc" />`

### `<pointLight position={[10, 10, 10]} />`
- **Default:** white, intensity `1`, positioned at world (10, 10, 10).
- A positional light that falls off with distance.
- **Affects:** the ground mesh only (same reason as above).
- To adjust: `<pointLight position={[20, 30, 10]} intensity={2} color="#ffe8c0" />`

### `<Sky>` (drei)
- Renders a procedural atmospheric sky using the Three.js `Sky` shader.
- **Does not emit light** into the scene — purely visual background.
- Key props currently used:

  | Prop | Value | Effect |
  |---|---|---|
  | `azimuth` | `1` | Sun left/right position (0–1 wraps around) |
  | `inclination` | `0.6` | Sun height (0 = zenith, 0.5 = horizon, 1 = below horizon) |
  | `distance` | `1000` | Radius of the sky sphere |

### Why lights don't affect grass
The grass material is a raw `shaderMaterial` — it does not include Three.js's lighting chunk (`#include <lights_fragment_begin>` etc.). Its shading is entirely determined by:
- **`tipColor`** and **`bottomColor`** uniforms (colour gradient root→tip)
- The diffuse texture sampled by `map`
- The `frc` varying (vertex position fraction along blade)

To add realistic lighting to grass, you would need to pass scene light data as uniforms and compute diffuse/specular in the fragment shader yourself.

---

## Inspector Tools

All tools below are available in **development mode** only (remove before shipping).

### r3f-perf — FPS / GPU / Draw Call HUD

`r3f-perf` is already installed.

```jsx
// App.js
import { Perf } from 'r3f-perf'

// Inside <Canvas>:
{import.meta.env.DEV && <Perf position="top-left" />}
```

Displays: FPS, GPU frame time, CPU frame time, draw calls, triangle count, texture memory.

Position options: `"top-left"` `"top-right"` `"bottom-left"` `"bottom-right"`

---

### leva — Live Parameter GUI

`leva` is already installed. Wire any uniform or prop to a live slider:

```jsx
// App.js
import { useControls } from 'leva'

export default function App() {
  const { instances, windSpeed, tipR, tipG } = useControls({
    instances:  { value: 50000, min: 1000,  max: 100000, step: 1000 },
    windSpeed:  { value: 4,     min: 0.5,   max: 20 },    // lower = faster (it's a divisor)
    tipR:       { value: 0,     min: 0,     max: 1, step: 0.01 },
    tipG:       { value: 0.6,   min: 0,     max: 1, step: 0.01 },
  })

  return (
    <Canvas ...>
      <Grass instances={instances} windDivisor={windSpeed} tipColor={[tipR, tipG, 0]} />
    </Canvas>
  )
}
```

**Hot-reloadable at runtime (no geometry rebuild):** uniforms — `time` divisor, `tipColor`, `bottomColor`, `bladeHeight`.

**Requires geometry recomputation (`useMemo` reruns):** `bW`, `bH`, `joints`, `width`, `instances`. These will cause a brief freeze while data is regenerated.

---

### Three.js Developer Tools — Scene Graph Inspector

No code changes required.

1. Install the **"Three.js Developer Tools"** extension from the Chrome Web Store.
2. Open the scene in Chrome with the dev server running.
3. Open DevTools (`F12`) → **"Three.js"** tab.

You can:
- Browse the full scene graph (meshes, lights, cameras)
- Inspect and **live-edit** material uniforms (e.g., change `tipColor` directly)
- View geometry attributes (`position`, `offset`, `orientation`, etc.)
- Inspect object transforms (position, rotation, scale)

---

### Chrome DevTools Performance Tab

For profiling frame budget:

1. Open the scene, then open DevTools → **Performance** tab.
2. Click record, interact with the scene for 3–5 seconds, stop.
3. Look for long tasks in the **Main** thread (JS) vs **GPU** time.
   - If JS is the bottleneck: reduce `instances` or move data setup out of the render path.
   - If GPU is the bottleneck: reduce `instances`, lower `dpr` cap, or reduce `joints`.
4. Cross-reference GPU time with the **r3f-perf** HUD for per-frame GPU ms.
