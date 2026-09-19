# Solar System — Interactive 3D Explorer

An interactive 3D visualization of the Solar System built with **Three.js** and **Vite**. Explore the planets and their moons, fly into a focused detail view, compare the physical sizes of every body side by side, and switch to a ratio-accurate "to scale" mode. Optimized for fast, controllable interaction on phones as well as desktops.

---

## Features

- **Main solar system view** — the Sun, eight planets, Earth's Moon, Saturn/Uranus/Neptune rings, an asteroid belt, and a Kuiper belt all orbiting in real time.
- **Orbit lines** — color-coded, clickable orbit paths (toggleable).
- **Detail view** — tap any planet to fly to a focused scene with its moons orbiting around it.
- **Moon focus** — tap a moon's orbit line or mesh to zoom to the moon; zoom with the mouse wheel or two-finger pinch, exit via back button or `Esc`.
- **Size comparison view** — a white-background row of the Sun, planets, and moons drawn to **true proportional size**, with a sidebar to toggle bodies on/off.
- **To Scale mode** — swaps the whole scene to real proportional distances/sizes while keeping every body visible.
- **Pause / resume** the simulation.
- **Info panel** — per-planet/moon description, physical stats, and a fun fact (toggle with the `i` key).
- **Mobile-first optimizations** — adaptive resolution, idle-frame skipping, pinch support, compact touch UI.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Rendering | [Three.js](https://threejs.org/) `^0.163.0` (`WebGLRenderer`) |
| Orbit controls | `OrbitControls` from three's examples |
| Bundler / dev server | [Vite](https://vitejs.dev/) 5 |
| Tests | [Vitest](https://vitest.dev/) (unit) + [Playwright](https://playwright.dev/) (e2e) |
| Textures | WebP (`public/static/images/*.webp`) |

---

## Getting Started

```bash
npm install

npm run dev          # start the Vite dev server
npm run build        # production build into dist/
npm run preview      # preview the production build

npm run test         # unit tests (Vitest)
npm run test:e2e     # end-to-end tests (Vitest + Playwright, spawns Vite)
```

Node 18+ is recommended.

---

## How It Works

### Rendering and the main loop — `src/main.js`

Everything starts in `main.js`:

1. A single `WebGLRenderer` is created (no antialiasing — the scene is mostly small textured spheres and points, and AA is expensive on phones).
2. A `Scene` is built: a procedural starfield (generated background + 10,000 star points) plus every object from `simulation.getAllObjects()` — the Sun, planets, Moon, rings, the two asteroid belts, and the eight orbit paths.
3. A `CameraManager` owns the two cameras (main + detail) and their `OrbitControls`.
4. A `UIController` wires up all DOM/pointer input and high-level UI flow.
5. `animate()` is the `requestAnimationFrame` loop. Each frame it:
   - computes `deltaTime` (clamped to `0.1s` so a background-tab stall doesn't teleport the planets),
   - advances the simulation (or feeds `0` while paused),
   - steps detail-scene animations,
   - drives camera transitions / fade curtains,
   - updates hover and moon-focus tracking,
   - renders exactly one of the three modes (main view, detail view, or comparison view).

#### Mobile performance: adaptive resolution

The render buffer starts at a device-appropriate pixel ratio — capped at `2` on fine-pointer (desktop) devices and `1.75` on coarse-pointer (touch) devices. A quality tuner watches the average frame time over rolling windows of 90 *rendered* frames:

- average > 26 ms → drop to the next lower ratio level (`[1, 1.25, 1.5, 1.75]` / `[1.5, 1.75, 2]`);
- average < 13 ms for two consecutive windows → restore a higher level, up to the device cap.

This means a hot, low-end phone automatically sheds pixels to hold ~40 fps instead of rendering 3× supersampled and dropping to the 20s.

#### Mobile performance: idle-frame skipping

The loop still runs every `requestAnimationFrame` (so input stays instant), but the *rasterization* is skipped when nothing could have changed:

- paused,
- no camera transition in flight,
- no user interaction in the last 350 ms,
- **and** the active camera/controls pose (position, quaternion, target) is unchanged from the previous rendered frame, within tiny thresholds.

Poses are tracked per camera (`mainPose` / `detailPose`). This is what makes the "paused" state cost ~0 GPU work — useful for battery life on phones.

### Celestial objects — `src/celestialObjects.js`

Defines the building blocks, all extending Three.js objects:

| Class / helper | Description |
|---|---|
| `Star` | A sphere that slowly rotates. Used for the Sun. |
| `Planet` | Sphere + texture, with `orbitRadius`, `orbitSpeed`, `rotationSpeed`, `axisTilt`, and per-planet `orbitInclination`. `update()` positions it on its orbit from the accumulated `simTime`. |
| `Moon` | Like a planet, but its position is computed **relative to its parent planet** (planet position + local orbital offset tilted by the planet's axial tilt). Reports `isMoon() === true`. |
| `PlanetRing` | A `RingGeometry` (64 segments) with hand-remapped UVs and a generated canvas texture. Follows its host planet and tilts with it. |
| `AsteroidBelt` | A single `THREE.Points` cloud (one draw call). The main belt has 1,500 grains, the Kuiper belt 15,000. `setRadii()` re-randomizes ring extent (used by to-scale mode); disables its own raycast for cheap picking. |
| `generateRingTexture()` | Procedurally paints a 16×512 canvas band (Saturn's rings, plus the faint Uranian/Neptunian rings) instead of shipping an image. |
| `createOrbitPath()` / `setOrbitPathRadius()` / `setOrbitPathThickness()` | Builds a closed `CatmullRomCurve3` → `TubeGeometry` ring (128 segments × 8 radial). The orbit line doubles as a **click target** (`userData.isOrbitPath.planet`), and its geometry can be rebuilt at a new radius (to-scale) or thickness (detail view adaptive thickness). |

### Simulation & scale logic — `src/simulation.js` and `src/scaleData.js`

`simulation.js` instantiates every body with **real world numbers** and normalizes them into scene units inside the constructors:

- `orbitRadius = planetOrbit / 3_000_000`
- `orbitSpeed = distancePerYear / 3_000_000_000_000`

So the orbits are proportional to reality from the start. `simulation.update(deltaTime)` advances the Sun, planets, Moon, rings, and belts each frame using the accumulated simulation clock.

**To Scale mode** (`setToScale`) is the interesting bit. `scaleData.js` holds real physics:

- `PLANET_RADII_KM`, `PLANET_ORBITS_KM` — real values,
- `unitsPerKm()` — `500 / Neptune's orbit in km`, i.e. the scale factor that pins Neptune's real orbit to scene distance 500 so the whole system fits in the camera's 5000-unit far plane,
- `displayRadius()` — real radii would be sub-pixel at true scale, so sizes are compressed upward with a square-root curve between `0.08` and `1.2` scene units, preserving their ordering while staying visible.

Switching to-scale rescales every body and orbit (`setOrbitPathRadius`), repositions the belts (`BELT_AU` / `KUIPER_BELT_AU`), rescales the rings, and bumps Earth's Moon size/orbit up to keep it visible.

### Camera & transitions — `src/cameraManager.js`

Two cameras and two control sets:

- **Main camera** — `PerspectiveCamera(50, aspect, 0.1, 5000)`, starting at `(170, 20, 2)`. Controls: left-drag rotate, middle-drag dolly, `minDistance 50`, `maxDistance 1000`, polar angle capped at 90° (you can't go under the ecliptic plane).
- **Detail camera** — used for both the detail view and the comparison view; framable via `frameCompare()` / `enterDetail()`.

`openDetail()` saves the current camera + target and starts a scripted **transition**: an out-cubic zoom toward the host body, a black **fade curtain** (`#detailFade`) to hide the scene swap, and an uncover. The `updateTransition()` state machine runs `zoom → cover → uncover` (and `cover → uncover` when exiting) and calls back into `UIController.enterDetail` / `leaveDetail` at the right moment.

**Moon focus** — `setMoonFocus()` remembers the camera pose, disables OrbitControls, and reparents the camera along the moon→host direction at a configurable `zoomDist` (clamped between `minDist`/`maxDist`). `updateMoonFocus()` lerps the camera 10% per frame toward the target. Zoom input:

- **Wheel** (desktop) — `handleMoonWheel()` multiplies `zoomDist` by 1.15.
- **Pinch** (touch) — the renderer element tracks two-pointer distances; `pinchMove()` applies `baseDistance / currentDistance` to `zoomDist`. While a moon is focused, `OrbitControls` is disabled and does not interfere.

### UI & interaction — `src/uiController.js`

`UIController` is the input/state hub:

- **Tap vs drag** — a `pointerdown` records a start position; a `pointermove` beyond 25 px² sets `mouseMoved`. On `pointerup`, a clean tap becomes a raycast click.
- **Click handling** (`onClick`) — raycasts against the active scene. Orbit paths map to their planet; moon meshes/moon orbit paths start a moon focus; otherwise the clicked body opens the detail view. Clicks are ignored during transitions, while moon-focusing, while in compare mode, or while the loading screen is up.
- **Hover** — pointer position is tracked only when the pointer is over the canvas. Tooltips are computed via raycast but **only for real mouse pointers** (`pointerType === 'mouse'`) and **at most once per 100 ms** — touch drags don't waste raycasts, and phones never show a hover tooltip.
- **Detail view** — `enterDetail` (re)creates a `DetailScene`, populates the info panel from `PLANET_DATA`/`MOON_INFO`, and manages the panel/back button.
- **Compare view** — `enterCompare` builds a `ComparisonScene` once, populates the sidebar (`buildCompareSidebar`), and frames the camera. `refreshCompareLayout()` is called on every selection change and rebuilds the meshes/labels.
- **Misc** — pause button, orbit visibility toggle, to-scale toggle, info panel toggle (`i` key), `Esc` walks back through compare → moon focus → detail.
- **Mobile hints** — if the device reports `(pointer: coarse)`, hint text switches from "Scroll to zoom" to "Pinch to zoom".
- **Scene disposal** — `disposeDetailScene()` frees the previous `DetailScene` whenever the planet changes, on leaving detail, or when entering compare (see *Resource management* below).

### Detail scene — `src/detailScene.js`

`DetailScene` is built fresh per planet:

- A starfield is added (the view needs its own background since it swaps scenes).
- The planet is re-created at its current size (optionally to-scale sizes).
- Detached moons come from `MOON_DATA` (a hand-curated `{name, texture, size, orb, speed}` table per planet). Moons orbit inside a tilted `moonOrbitGroup`; each moon gets a thin orbit ring used for clicking.
- Ringed planets get their rings rebuilt.
- A fake "Sun" glow-source mesh is placed at a distance for scene orientation.
- `frameRadius` is computed from the planet + outer moons and used to frame the detail camera.

One detail worth calling out: **adaptive orbit ring thickness**. `updateMoonRingThickness()` scales moon orbit rings by camera distance (and shrinks them to hairline width while focusing a moon) and only rebuilds the tube geometry when the needed thickness changes by > 12% — that's what keeps the rings from looking like blurry noodles at either extreme while avoiding per-frame geometry rebuilding.

### Comparison view — `src/comparisonScene.js`

A separate white-background scene whose rows are laid out **accurately to scale**:

- `buildBodyList()` produces the Sun, 8 planets, and 21 moons (from `MOON_DATA`), each with real km values and host relationship.
- `bodyDisplayRadius()` scales every radius relative to the largest selected body, capped at `MAX_DISPLAY_RADIUS = 1.5`.
- `layoutRow()` / `totalRowWidth()` place bodies left-to-right without overlap, centered in the view.
- Each body is a textured sphere; labels are `Sprite`s rendered from 512×128 canvas textures with `depthTest: false` so they stay readable.
- The sidebar toggles membership in `compareSelected`; `setSelected()` rebuilds meshes + labels and the camera re-frames.

### Starfield — `src/starfield.js`

Two layers, both fully procedural (no loaded HDR):
1. A 2048×1024 `EquirectangularReflectionMapping` canvas texture with a few faint radial "nebula" gradients, used as `scene.background`.
2. A 10,000-point `THREE.Points` cloud spread on a sphere of radius 2500 with tinted vertex colors and additive blending.

`points.raycast = () => {}` keeps the starfield out of picking.

### Resource management — `src/resources.js`

- A shared `THREE.LoadingManager` drives the loading screen's progress bar (every texture load counts toward the percentage).
- `disposeObject3D(root)` walks an object graph and disposes geometries and materials. Textures are disposed **only if they are canvas-generated** (`HTMLCanvasElement` backing) — because loader-cached image textures (all the `public/static/images/*.webp`) are shared across scenes, disposing them would blank out the main scene. This is how the per-planet `DetailScene` rebuilds (each with its own 2K starfield + canvas textures) don't leak GPU memory across a long session.

### Data files — `src/planetData.js` / `src/moonData.js` / `src/scaleData.js`

Pure data, no logic:

- `planetData.js` — per-planet color, description, stat rows, and fun fact for the info panel; also the orbital inclination used in the main view.
- `moonData.js` — the same for every moon shown in detail/compare views.
- `scaleData.js` — real physical measurements and the conversion helpers described above (`unitsPerKm`, `displayRadius`, `MOON_RATIOS`, ...).

### Styles & mobile UX — `src/style.css` and `index.html`

- All UI is DOM overlaid on the canvas (`#viewControls`, `#pauseButton`, `#detailView`, `#compareView`, `#tooltip`, `#loadingScreen`).
- **Touch targets** are ≥ 48 px.
- Under `(pointer: coarse)` or ≤ 768 px the expensive `backdrop-filter` (GPU-heavy blur) is switched off so mid-range phones don't burn GPU on translucent panels.
- On ≤ 480 px the top controls collapse to icon-only pills (fixing overflow on narrow screens).
- Fixed elements near screen edges use `env(safe-area-inset-*)` so the phone notch / home indicator never covers them.

---

## Asset Pipeline

Planet and moon surface images live in `public/static/images/` as **WebP** (converted from lossy JPG originals to cut payload from ~6.7 MB → ~2.5 MB). They're referenced by filename in `simulation.js`, `detailScene.js` (`MOON_DATA`), and `comparisonScene.js`. References are resolved through the shared `TextureLoader`, which caches by URL — so a given texture is only fetched once.

`public/` is copied verbatim into `dist/` on build.

---

## Testing

- **Unit tests** (`npm run test`) — `tests/*.test.js`, run under Vitest Node with `three` and `window`/`document` mocked. They cover the simulation math, celestial object construction/motion, and the comparison layout helpers (`comparisonScene.test.js`, `celestialObjects.test.js`, `simulation.test.js`).
- **E2E tests** (`npm run test:e2e`) — Vitest + Playwright chromium. The suite spawns its own Vite server, waits until it responds, and drives a headless browser:
  - `tests/loading.e2e.test.js` — asserts the app loads, the progress screen completes (tolerating a so-fast load that the screen hides before the bar can be read), the loading screen hides, and the canvas + pause button are usable.
  - `tests/compare.e2e.test.js` — opens the comparison view, verifies the sidebar lists ≥ 29 bodies, toggles bodies on/off, and closes the view.

The e2e config is isolated in `vitest.e2e.config.js` (different port, Playwright timeouts).

---

## Project Structure

```
index.html                  # UI shell (loading screen, buttons, panels)
public/static/images/       # WebP textures (copied verbatim to dist)
src/
  main.js                   # renderer, scene, render loop, adaptive quality, idle-skip
  cameraManager.js          # cameras, OrbitControls, transitions, moon focus, pinch zoom
  celestialObjects.js       # Planet/Moon/Ring/Belt/Orbit classes + generators
  comparisonScene.js        # proportional size-comparison view
  detailScene.js            # per-planet detail view with moons
  moonData.js               # moon info text/colors (info panel)
  planetData.js             # planet info text/colors/inclination (info panel)
  resources.js              # loading manager + GPU disposal helper
  scaleData.js              # real physics constants + scale conversion math
  simulation.js             # instantiates all bodies; sim update + to-scale swap
  starfield.js              # procedural background + star points
  style.css                 # all UI styling + mobile rules
  uiController.js           # input, click/hover, detail/compare state, info panels
tests/                      # Vitest unit + Playwright e2e specs
vite.config.js              # Vite + Vitest unit config
vitest.e2e.config.js        # Vitest e2e Playwright config
```