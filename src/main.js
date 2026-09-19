import * as THREE from 'three';
import * as CELESTIAL from './celestialObjects.js';
import { simulation } from './simulation.js';
import { DetailScene } from './detailScene.js';
import { CameraManager } from './cameraManager.js';
import { UIController } from './uiController.js';
import { loadingManager } from './resources.js';
import { createStarfield } from './starfield.js';

let renderer, scene;
let lastFrameTime = performance.now();

const isCoarse = !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

// Adaptive render resolution: start near the device cap but downshift when the
// device cannot hold framerate. Phones cap lower than desktops (fill rate win).
const RATIO_LEVELS = isCoarse ? [1, 1.25, 1.5, 1.75] : [1.5, 1.75, 2];
let ratioLevel = RATIO_LEVELS.length - 1;
const frameTimes = [];
let fastWindows = 0;

function applyPixelRatio() {
  renderer.setPixelRatio(RATIO_LEVELS[ratioLevel]);
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function tuneQuality(rawGap) {
  frameTimes.push(rawGap);
  if (frameTimes.length < 90) return;
  const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  frameTimes.length = 0;
  if (avg > 26) {
    fastWindows = 0;
    if (ratioLevel > 0) {
      ratioLevel--;
      applyPixelRatio();
    }
  } else if (avg < 13) {
    fastWindows++;
    if (fastWindows >= 2 && ratioLevel < RATIO_LEVELS.length - 1) {
      ratioLevel++;
      fastWindows = 0;
      applyPixelRatio();
    }
  } else {
    fastWindows = 0;
  }
}

// Idle-frames: when paused and nothing moved, skip rasterization to save
// battery/thermal headroom on phones. Poses are tracked per camera.
const POSE_EPS_POS = 1e-7;
const POSE_EPS_TGT = 1e-7;
const POSE_EPS_QUAT = 1e-9;
const mainPose = { set: false, pos: new THREE.Vector3(), quat: new THREE.Quaternion(), target: new THREE.Vector3() };
const detailPose = { set: false, pos: new THREE.Vector3(), quat: new THREE.Quaternion(), target: new THREE.Vector3() };

function poseChanged(camera, controls, cache) {
  if (!cache.set) return true;
  const dPos = camera.position.distanceToSquared(cache.pos);
  const dTgt = controls.target.distanceToSquared(cache.target);
  const q = camera.quaternion;
  const dQuat =
    (q.x - cache.quat.x) ** 2 + (q.y - cache.quat.y) ** 2 +
    (q.z - cache.quat.z) ** 2 + (q.w - cache.quat.w) ** 2;
  return dPos > POSE_EPS_POS || dTgt > POSE_EPS_TGT || dQuat > POSE_EPS_QUAT;
}

function savePose(camera, controls, cache) {
  cache.pos.copy(camera.position);
  cache.quat.copy(camera.quaternion);
  cache.target.copy(controls.target);
  cache.set = true;
}

let interactionsAt = performance.now();

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const pct = Math.round((itemsLoaded / itemsTotal) * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressText').textContent = pct + '%';
};
loadingManager.onLoad = () => {
  const screen = document.getElementById('loadingScreen');
  screen.classList.add('fade-out');
  setTimeout(() => { screen.style.display = 'none'; }, 600);
};

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: false });
  applyPixelRatio();
  document.body.appendChild(renderer.domElement);
  
  scene = new THREE.Scene();
  createStarfield(scene);
  
  for (const obj of simulation.getAllObjects()) {
    scene.add(obj);
  }
  
  const cameraManager = new CameraManager(renderer);
  cameraManager.scene = scene;
  
  const uiController = new UIController(cameraManager, simulation);
  
  window.addEventListener('resize', () => {
    const cameraAspect = window.innerWidth / window.innerHeight;
    cameraManager.camera.aspect = cameraAspect;
    cameraManager.detailCamera.aspect = cameraAspect;
    cameraManager.camera.updateProjectionMatrix();
    cameraManager.detailCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  document.addEventListener('pointerdown', (event) => {
    interactionsAt = performance.now();
    uiController.mouseDown = true;
    uiController.mouseMoved = false;
    uiController.mouseDownPos = { x: event.clientX, y: event.clientY };
  });
  
  document.addEventListener('pointermove', (event) => {
    if (uiController.mouseDown) {
      const dx = event.clientX - uiController.mouseDownPos.x;
      const dy = event.clientY - uiController.mouseDownPos.y;
      if (dx * dx + dy * dy > 25) uiController.mouseMoved = true;
    }
  });
  
  document.addEventListener('pointerup', (event) => {
    interactionsAt = performance.now();
    uiController.mouseDown = false;
    if (!uiController.mouseMoved) uiController.onClick(event, cameraManager);
  });
  
  for (const type of ['keydown', 'wheel', 'touchstart']) {
    document.addEventListener(type, () => { interactionsAt = performance.now(); }, { capture: true, passive: true });
  }
  
  animate(cameraManager, uiController);
}

function updateAndRender(cameraManager, uiController, deltaTime, rawGap) {
  const paused = uiController.getPaused();
  let camera;
  let targetScene;
  let controls;
  let cache;

  if (uiController.compareActive && uiController.compareScene) {
    targetScene = uiController.compareScene.scene;
    camera = cameraManager.detailCamera;
    controls = cameraManager.detailControls;
    cache = detailPose;
    if (!paused) uiController.compareScene.update(deltaTime);
  } else if (uiController.moonFocus) {
    const focus = uiController.moonFocus;
    camera = focus.isDetail ? cameraManager.detailCamera : cameraManager.camera;
    targetScene = focus.isDetail
      ? (uiController.detailScene && uiController.detailScene.scene) || scene
      : scene;
    controls = focus.isDetail ? cameraManager.detailControls : cameraManager.controls;
    cache = focus.isDetail ? detailPose : mainPose;
  } else if (uiController.detailActive) {
    targetScene = uiController.detailScene && uiController.detailScene.scene;
    camera = cameraManager.detailCamera;
    controls = cameraManager.detailControls;
    cache = detailPose;
  } else {
    targetScene = scene;
    camera = cameraManager.camera;
    controls = cameraManager.controls;
    cache = mainPose;
  }

  if (controls && controls.update && !uiController.moonFocus) {
    controls.update();
  }
  targetScene = targetScene || scene;

  const recentInteraction = performance.now() - interactionsAt < 350;
  const shouldRender =
    !paused ||
    !!cameraManager.transition ||
    recentInteraction ||
    poseChanged(camera, controls, cache);

  if (shouldRender) {
    renderer.render(targetScene, camera);
    savePose(camera, controls, cache);
    if (rawGap > 0 && rawGap < 500) tuneQuality(rawGap);
  }
}

function animate(cameraManager, uiController) {
  requestAnimationFrame(() => animate(cameraManager, uiController));
  
  const now = performance.now();
  const rawGap = now - lastFrameTime;
  const deltaTime = Math.min(rawGap / 1000, 0.1);
  lastFrameTime = now;
  
  if (!uiController.getPaused()) {
    simulation.update(deltaTime);
    if (uiController.detailActive && uiController.detailScene) {
      uiController.detailScene.update(deltaTime, cameraManager.detailCamera, !!uiController.moonFocus);
    }
  } else if (uiController.detailActive && uiController.detailScene) {
    uiController.detailScene.update(0, cameraManager.detailCamera, !!uiController.moonFocus);
  }
  
  cameraManager.updateTransition(
    deltaTime,
    uiController.fadeEl,
    () => uiController.enterDetail(DetailScene, cameraManager),
    () => uiController.leaveDetail(cameraManager),
    () => {}
  );
  
  uiController.updateHover(cameraManager);
  uiController.updateMoonFocus(cameraManager);
  
  updateAndRender(cameraManager, uiController, deltaTime, rawGap);
}

init();