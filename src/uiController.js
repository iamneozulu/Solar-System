import * as THREE from 'three';
import { PLANET_DATA } from './planetData.js';
import { MOON_INFO } from './moonData.js';
import { DetailScene } from './detailScene.js';
import { ComparisonScene } from './comparisonScene.js';
import { disposeObject3D } from './resources.js';

export class UIController {
  constructor(cameraManager, simulation) {
    this.cameraManager = cameraManager;
    this.simulation = simulation;
    this.detailScene = null;
    this.detailPlanet = null;
    this.detailActive = false;
    this.moonFocus = null;
    this.compareScene = null;
    this.compareActive = false;
    this.compareSelected = new Set(['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']);
    this.isPaused = false;
    this.infoVisible = true;
    this.hoverPointer = new THREE.Vector2(-2, -2);
    this.hoverScreen = { x: -1, y: -1 };
    this.hoverPointerType = 'mouse';
    this.lastHoverAt = 0;
    
    this.tooltip = document.getElementById('tooltip');
    this.fadeEl = document.getElementById('detailFade');
    this.toScaleButton = document.getElementById('toScaleButton');
    this.orbitToggle = document.getElementById('orbitToggle');
    this.orbitVisible = true;
    this.compareButton = document.getElementById('compareButton');
    this.compareToggle = document.getElementById('compareToggle');
    this.compareSidebarVisible = true;
    
    this.setupEventListeners();
    this.updateToScaleButton();
    this.applyOrbitVisibility();
  }
  
  setupEventListeners() {
    document.addEventListener('pointermove', (event) => {
      this.hoverPointerType = event.pointerType || 'mouse';
      if (event.target === this.cameraManager.renderer.domElement) {
        this.hoverPointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.hoverPointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.hoverScreen.x = event.clientX;
        this.hoverScreen.y = event.clientY;
      } else {
        this.hoverPointer.x = -2;
        this.hoverPointer.y = -2;
      }
    });
    
    document.getElementById('pauseButton').onclick = () => {
      this.isPaused = !this.isPaused;
      document.getElementById('pauseButton').classList.toggle('paused', this.isPaused);
    };
    
    document.getElementById('backButton').onclick = () => {
      if (this.compareActive) this.leaveCompare();
      else if (this.moonFocus) this.exitMoonFocus(this.cameraManager);
      else this.exitDetail(this.cameraManager);
    };

    const compareBackButton = document.getElementById('compareBackButton');
    if (compareBackButton) {
      compareBackButton.onclick = () => this.leaveCompare();
    }

    if (this.compareButton) {
      this.compareButton.onclick = () => this.toggleCompare();
    }

    if (this.compareToggle) {
      this.compareToggle.onclick = () => this.toggleCompareSidebar();
    }

    const compareAllButton = document.getElementById('compareAllButton');
    if (compareAllButton) {
      compareAllButton.onclick = () => this.setAllCompareBodies(true);
    }

    const compareNoneButton = document.getElementById('compareNoneButton');
    if (compareNoneButton) {
      compareNoneButton.onclick = () => this.setAllCompareBodies(false);
    }

    document.getElementById('infoToggle').onclick = () => this.toggleInfoPanel();

    if (this.toScaleButton) {
      this.toScaleButton.onclick = () => this.toggleToScale();
    }

    if (this.orbitToggle) {
      this.orbitToggle.onclick = () => this.toggleOrbits();
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (this.compareActive) this.leaveCompare();
        else if (this.moonFocus) this.exitMoonFocus(this.cameraManager);
        else this.exitDetail(this.cameraManager);
      }
      if (event.key === 'i' || event.key === 'I') {
        this.toggleInfoPanel();
      }
    });

    this.applyMobileHints();
  }

  applyMobileHints() {
    const coarse = !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (!coarse) return;
    const zoom = ' Pinch to zoom';
    const detailHint = document.getElementById('detailHint');
    if (detailHint && detailHint.firstChild) {
      detailHint.firstChild.textContent = 'Drag to rotate ·' + zoom;
    }
    const compareHint = document.getElementById('compareHint');
    if (compareHint) {
      compareHint.textContent = 'Drag to rotate ·' + zoom;
    }
  }

  toggleCompare() {
    if (this.cameraManager.transition) return;
    if (this.compareActive) this.leaveCompare();
    else this.enterCompare();
  }

  enterCompare() {
    if (this.compareActive) return;
    if (this.detailActive) {
      this.detailActive = false;
      this.disposeDetailScene();
      this.detailPlanet = null;
      this.moonFocus = null;
      this.cameraManager.leaveDetail();
      document.getElementById('detailPanel').classList.remove('open');
      document.getElementById('detailView').classList.add('hidden');
    }

    this.compareActive = true;
    this.compareSidebarVisible = true;
    document.getElementById('compareView').classList.remove('sidebar-hidden');
    if (!this.compareScene) {
      this.compareScene = new ComparisonScene();
      this.buildCompareSidebar();
    }
    this.refreshCompareLayout();

    this.cameraManager.enterCompare(this.compareScene);
    this.updateCompareButton();
    document.getElementById('compareView').classList.remove('hidden');
  }

  leaveCompare() {
    if (!this.compareActive) return;
    this.compareActive = false;
    this.cameraManager.leaveCompare();
    this.updateCompareButton();
    document.getElementById('compareView').classList.add('hidden');
  }

  updateCompareButton() {
    if (!this.compareButton) return;
    this.compareButton.classList.toggle('active', this.compareActive);
  }

  buildCompareSidebar() {
    const list = document.getElementById('compareList');
    if (!list || !this.compareScene) return;
    list.innerHTML = '';

    for (const body of this.compareScene.bodies) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'compare-item';
      item.dataset.name = body.name;

      const dot = document.createElement('span');
      dot.className = 'compare-item-dot';
      dot.style.background = body.color;

      const name = document.createElement('span');
      name.className = 'compare-item-name';
      name.textContent = body.name;

      const km = document.createElement('span');
      km.className = 'compare-item-km';
      km.textContent = formatKm(body.km) + (body.host ? ` · ${body.host}'s moon` : '');

      item.appendChild(dot);
      item.appendChild(name);
      item.appendChild(km);

      item.onclick = () => this.toggleCompareBody(body.name, item);
      item.classList.toggle('off', !this.compareSelected.has(body.name));
      list.appendChild(item);
    }
  }

  toggleCompareBody(name, item) {
    if (this.compareSelected.has(name)) this.compareSelected.delete(name);
    else this.compareSelected.add(name);
    if (item) item.classList.toggle('off', !this.compareSelected.has(name));
    this.refreshCompareLayout();
  }

  setAllCompareBodies(selectAll) {
    if (!this.compareScene) return;
    this.compareSelected.clear();
    if (selectAll) {
      for (const body of this.compareScene.bodies) this.compareSelected.add(body.name);
    }
    document.querySelectorAll('.compare-item').forEach((el) => {
      el.classList.toggle('off', !this.compareSelected.has(el.dataset.name));
    });
    this.refreshCompareLayout();
  }

  refreshCompareLayout() {
    if (!this.compareScene) return;
    this.compareScene.setSelected(this.compareSelected);
    this.cameraManager.frameCompare(this.compareScene);
  }

  toggleCompareSidebar() {
    this.compareSidebarVisible = !this.compareSidebarVisible;
    document.getElementById('compareView')?.classList.toggle('sidebar-hidden', !this.compareSidebarVisible);
  }

  toggleInfoPanel() {
    this.infoVisible = !this.infoVisible;
    document.getElementById('detailPanel')?.classList.toggle('collapsed', !this.infoVisible);
    document.getElementById('detailHint')?.classList.toggle('collapsed', !this.infoVisible);
    document.getElementById('infoToggle')?.classList.toggle('off', !this.infoVisible);
  }

  toggleToScale() {
    if (this.cameraManager.transition) return;
    this.simulation.setToScale(!this.simulation.toScale);
    this.updateToScaleButton();
    if (this.detailActive && this.detailScene && this.detailPlanet) {
      this.rebuildDetailScene();
    }
  }

  updateToScaleButton() {
    if (!this.toScaleButton) return;
    if (this.simulation.toScale) {
      this.toScaleButton.classList.add('active');
    } else {
      this.toScaleButton.classList.remove('active');
    }
  }

  toggleOrbits() {
    this.orbitVisible = !this.orbitVisible;
    this.applyOrbitVisibility();
  }

  applyOrbitVisibility() {
    const visible = this.orbitVisible;
    for (const path of this.simulation.orbitPaths) {
      path.visible = visible;
    }
    if (this.detailScene) {
      for (const moon of this.detailScene.moons) {
        moon.ring.visible = visible;
      }
    }
    if (!this.orbitToggle) return;
    if (visible) {
      this.orbitToggle.classList.remove('off');
    } else {
      this.orbitToggle.classList.add('off');
    }
  }

  rebuildDetailScene() {
    if (this.moonFocus) this.exitMoonFocus(this.cameraManager);
    this.disposeDetailScene();
    this.enterDetail(DetailScene, this.cameraManager);
  }
  
  onClick(event, cameraManager) {
    if (!cameraManager || !cameraManager.scene) return;
    if (cameraManager.transition || this.moonFocus) return;
    if (this.compareActive) return;
    
    // Ignore clicks while loading screen is visible
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen && loadingScreen.style.display !== 'none') return;
    
    const pointer = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    if (this.detailActive && this.detailScene) {
      cameraManager.raycaster.setFromCamera(pointer, cameraManager.detailCamera);
      const intersects = cameraManager.raycaster.intersectObjects(this.detailScene.scene.children, true);
      for (const hit of intersects) {
        const obj = hit.object;
        if (obj.userData.isOrbitPath && obj.userData.isMoon && obj.userData.moonName) {
          const moonMesh = this.detailScene.moons.find(m => m.mesh.name === obj.userData.moonName)?.mesh;
          if (moonMesh) {
            this.setMoonFocus(moonMesh, this.detailScene.planetObj, true, cameraManager);
          }
          return;
        }
        if (obj.userData.isOrbitPath) continue;
        if (obj.userData.isMoon) {
          this.setMoonFocus(obj, this.detailScene.planetObj, true, cameraManager);
          return;
        }
        return;
      }
      return;
    }
    
    cameraManager.raycaster.setFromCamera(pointer, cameraManager.camera);
    const intersects = cameraManager.raycaster.intersectObjects(cameraManager.scene.children, true);
    
    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData.isOrbitPath && obj.userData.planet) {
        this.openDetail(obj.userData.planet, cameraManager);
        return;
      }
      if (obj.userData.isOrbitPath && obj.userData.isMoon && obj.userData.moonName) {
        const moonObj = this.simulation.Lunar.name === obj.userData.moonName ? this.simulation.Lunar : null;
        if (moonObj) this.setMoonFocus(moonObj, moonObj.planet, false, cameraManager);
        return;
      }
      if (typeof obj.isMoon === 'function' && obj.isMoon()) {
        this.setMoonFocus(obj, obj.planet, false, cameraManager);
        return;
      }
      this.openDetail(obj, cameraManager);
    }
  }
  
  openDetail(obj, cameraManager) {
    if (!obj || !obj.position) return;
    const isMoon = typeof obj.isMoon === 'function' && obj.isMoon();
    const host = isMoon ? obj.planet : obj;
    if (this.detailPlanet === host || cameraManager.transition) return;
    
    this.detailPlanet = host;
    cameraManager.openDetail(host, host === this.simulation.Sun);
  }
  
  enterDetail(detailSceneClass, cameraManager) {
    this.detailActive = true;
    if (!this.detailScene || this.detailScene.name !== this.detailPlanet.name) {
      this.disposeDetailScene();
      this.detailScene = new detailSceneClass(this.detailPlanet, !!this.simulation.toScale);
    }
    
    cameraManager.enterDetail(this.detailScene, this.detailPlanet);
    this.populateDetailInfo(this.detailPlanet);
    this.applyOrbitVisibility();
    document.getElementById('detailPanel').classList.add('open');
    document.getElementById('detailView').classList.remove('hidden');
  }
  
  leaveDetail(cameraManager) {
    this.detailActive = false;
    this.disposeDetailScene();
    this.detailPlanet = null;
    this.moonFocus = null;
    document.documentElement.style.setProperty('--accent', '#ffd600');
    
    cameraManager.leaveDetail();
    
    document.getElementById('detailPanel').classList.remove('open');
    document.getElementById('detailView').classList.add('hidden');
  }
  
  exitDetail(cameraManager) {
    if (!this.detailActive || cameraManager.transition) return;
    cameraManager.exitDetail();
  }
  
  setMoonFocus(moonMesh, host, isDetail, cameraManager) {
    if (this.moonFocus || cameraManager.transition) return;
    
    this.moonFocus = cameraManager.setMoonFocus(moonMesh, host, isDetail);
    if (!this.moonFocus) return;
    
    this.populateDetailInfo(moonMesh);
    document.getElementById('detailPanel').classList.add('open');
    document.getElementById('detailView').classList.remove('hidden');
  }
  
  exitMoonFocus(cameraManager) {
    const focus = this.moonFocus;
    if (!focus) return;
    
    cameraManager.exitMoonFocus();
    
    if (focus.isDetail) {
      this.populateDetailInfo(this.detailPlanet);
    } else {
      document.getElementById('detailPanel').classList.remove('open');
      document.getElementById('detailView').classList.add('hidden');
    }
    this.moonFocus = null;
  }
  
  populateDetailInfo(object) {
    const name = object.name;
    const data = PLANET_DATA[name] || MOON_INFO[name];
    if (!data) return;
    
    document.getElementById('detailTitle').textContent = name;
    document.getElementById('detailDescription').textContent = data.description;
    document.getElementById('detailColorDot').style.background = data.color;
    document.getElementById('detailPanel').style.borderColor = data.color;
    document.getElementById('detailTitle').style.color = data.color;
    document.documentElement.style.setProperty('--accent', data.color);
    
    const detailsEl = document.getElementById('detailDetails');
    detailsEl.innerHTML = '';
    for (const [label, value] of Object.entries(data.details)) {
      const row = document.createElement('div');
      row.className = 'detail-row';
      row.innerHTML = `<span class="detail-label">${label}</span><span class="detail-value">${value}</span>`;
      detailsEl.appendChild(row);
    }
    
    document.getElementById('detailFunFact').textContent = '💡 ' + data.funFact;
  }
  
  updateHover(cameraManager) {
    if (!cameraManager || !cameraManager.scene) return;
    if (cameraManager.transition || !this.infoVisible || this.hoverPointer.x < -1.9) {
      this.tooltip.classList.remove('visible');
      return;
    }
    if (this.hoverPointerType !== 'mouse') {
      this.tooltip.classList.remove('visible');
      return;
    }
    const now = performance.now();
    if (now - this.lastHoverAt < 100) return;
    this.lastHoverAt = now;
    
    const activeScene = this.compareActive && this.compareScene
      ? this.compareScene.scene
      : (this.detailActive && this.detailScene ? this.detailScene.scene : cameraManager.scene);
    const activeCamera = this.compareActive
      ? cameraManager.detailCamera
      : (this.detailActive && this.detailScene ? cameraManager.detailCamera : cameraManager.camera);
    
    cameraManager.raycaster.setFromCamera(this.hoverPointer, activeCamera);
    const hits = cameraManager.raycaster.intersectObjects(activeScene.children, true);
    
    let label = null;
    for (const hit of hits) {
      label = this.hoverLabelFor(hit.object);
      if (label) break;
    }
    
    if (!label) {
      this.tooltip.classList.remove('visible');
      return;
    }
    
    this.tooltip.textContent = label.name;
    if (label.color) this.tooltip.style.borderColor = label.color;
    this.tooltip.style.left = this.hoverScreen.x + 16 + 'px';
    this.tooltip.style.top = this.hoverScreen.y + 16 + 'px';
    this.tooltip.classList.add('visible');
  }
  
  hoverLabelFor(obj) {
    if (obj.userData.isCompareBody) {
      const bodyName = obj.userData.bodyName;
      return { name: bodyName, color: PLANET_DATA[bodyName]?.color || MOON_INFO[bodyName]?.color || null };
    }
    if (obj.userData.isOrbitPath && obj.userData.planet) {
      return { name: obj.userData.planet.name, color: obj.userData.planet.color };
    }
    if (obj.userData.isOrbitPath && obj.userData.isMoon && obj.userData.moonName) {
      return { name: obj.userData.moonName, color: MOON_INFO[obj.userData.moonName]?.color || '#5a6a8a' };
    }
    if (typeof obj.isMoon === 'function' && obj.isMoon()) {
      return { name: obj.name, color: MOON_INFO[obj.name]?.color || null };
    }
    if (obj.userData.isMoon) {
      return { name: obj.name, color: MOON_INFO[obj.name]?.color || null };
    }
    if (obj.planet && obj.planet.name) {
      return { name: obj.planet.name, color: obj.planet.color };
    }
    if (obj.name) {
      return { name: obj.name, color: PLANET_DATA[obj.name]?.color || obj.color || null };
    }
    return null;
  }
  
  updateMoonFocus(cameraManager) {
    if (!cameraManager) return;
    cameraManager.updateMoonFocus();
  }
  
  getPaused() {
    return this.isPaused;
  }
  
  disposeDetailScene() {
    if (this.detailScene) {
      disposeObject3D(this.detailScene.scene);
      this.detailScene = null;
    }
  }

  setDetailScene(scene) {
    this.detailScene = scene;
  }
  
  getDetailScene() {
    return this.detailScene;
  }
  
  setCameraManagerScene(scene) {
    this.cameraManager.scene = scene;
  }
}

function formatKm(km) {
  if (km >= 1000) {
    return km.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' km';
  }
  return km.toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' km';
}