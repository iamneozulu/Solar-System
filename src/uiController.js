import * as THREE from 'three';
import { PLANET_DATA } from './planetData.js';
import { MOON_INFO } from './moonData.js';

export class UIController {
  constructor(cameraManager, simulation) {
    this.cameraManager = cameraManager;
    this.simulation = simulation;
    this.detailScene = null;
    this.detailPlanet = null;
    this.detailActive = false;
    this.moonFocus = null;
    this.isPaused = false;
    this.infoVisible = true;
    this.hoverPointer = new THREE.Vector2(-2, -2);
    this.hoverScreen = { x: -1, y: -1 };
    
    this.tooltip = document.getElementById('tooltip');
    this.fadeEl = document.getElementById('detailFade');
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    document.addEventListener('pointermove', (event) => {
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
      if (this.moonFocus) this.exitMoonFocus(this.cameraManager);
      else this.exitDetail(this.cameraManager);
    };

    document.getElementById('infoToggle').onclick = () => this.toggleInfoPanel();

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (this.moonFocus) this.exitMoonFocus(this.cameraManager);
        else this.exitDetail(this.cameraManager);
      }
      if (event.key === 'i' || event.key === 'I') {
        this.toggleInfoPanel();
      }
    });
  }

  toggleInfoPanel() {
    this.infoVisible = !this.infoVisible;
    document.getElementById('detailPanel')?.classList.toggle('collapsed', !this.infoVisible);
    document.getElementById('detailHint')?.classList.toggle('collapsed', !this.infoVisible);
    document.getElementById('infoToggle')?.classList.toggle('off', !this.infoVisible);
  }
  
  onClick(event, cameraManager) {
    if (!cameraManager || !cameraManager.scene) return;
    if (cameraManager.transition || this.moonFocus) return;
    
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
      this.detailScene = new detailSceneClass(this.detailPlanet);
    }
    
    cameraManager.enterDetail(this.detailScene, this.detailPlanet);
    this.populateDetailInfo(this.detailPlanet);
    document.getElementById('detailPanel').classList.add('open');
    document.getElementById('detailView').classList.remove('hidden');
  }
  
  leaveDetail(cameraManager) {
    this.detailActive = false;
    this.detailScene = null;
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
    
    const activeScene = this.detailActive && this.detailScene ? this.detailScene.scene : cameraManager.scene;
    const activeCamera = this.detailActive && this.detailScene ? cameraManager.detailCamera : cameraManager.camera;
    
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