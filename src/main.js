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
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  
  scene = new THREE.Scene();
  createStarfield(scene);
  
  for (const obj of simulation.getAllObjects()) {
    scene.add(obj);
  }
  
  const cameraManager = new CameraManager(renderer);
  cameraManager.scene = scene;
  
  const uiController = new UIController(cameraManager, simulation);
  
  window.addEventListener('resize', () => cameraManager.onWindowResize());
  
  document.addEventListener('pointerdown', (event) => {
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
    uiController.mouseDown = false;
    if (!uiController.mouseMoved) uiController.onClick(event, cameraManager);
  });
  
  animate(cameraManager, uiController);
}

function animate(cameraManager, uiController) {
  requestAnimationFrame(() => animate(cameraManager, uiController));
  
  const now = performance.now();
  const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.1);
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
  
  if (uiController.compareActive && uiController.compareScene) {
    if (!uiController.getPaused()) uiController.compareScene.update(deltaTime);
    cameraManager.detailControls.update();
    renderer.render(uiController.compareScene.scene, cameraManager.detailCamera);
  } else if (uiController.moonFocus) {
    if (uiController.moonFocus.isDetail) {
      renderer.render(uiController.detailScene.scene, cameraManager.detailCamera);
    } else {
      renderer.render(scene, cameraManager.camera);
    }
  } else if (uiController.detailActive) {
    cameraManager.detailControls.update();
    renderer.render(uiController.detailScene.scene, cameraManager.detailCamera);
  } else {
    cameraManager.controls.update();
    renderer.render(scene, cameraManager.camera);
  }
}

init();