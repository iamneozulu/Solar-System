import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraManager {
  constructor(renderer) {
    this.renderer = renderer;
    
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 5000);
    this.camera.position.set(170, 20, 2);
    
    this.detailCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 6000);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY };
    this.controls.minDistance = 50;
    this.controls.maxDistance = 1000;
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
    this.controls.panSpeed = 1;
    
    this.detailControls = new OrbitControls(this.detailCamera, this.renderer.domElement);
    this.detailControls.enabled = false;
    this.detailControls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY };
    this.detailControls.minDistance = 1;
    this.detailControls.maxDistance = 500;
    this.detailControls.maxPolarAngle = Math.PI;
    this.detailControls.panSpeed = 1;
    
    this.transition = null;
    this.returnPos = null;
    this.returnTarget = null;
    
    this.raycaster = new THREE.Raycaster();
    
    if (this.renderer.domElement && this.renderer.domElement.addEventListener) {
      this.onMoonWheel = (event) => this.handleMoonWheel(event);
      this.renderer.domElement.addEventListener('wheel', this.onMoonWheel, { passive: false });
    }
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.detailCamera.aspect = window.innerWidth / window.innerHeight;
    this.detailCamera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  openDetail(host, isSun = false) {
    this.returnPos = this.camera.position.clone();
    this.returnTarget = this.controls.target.clone();
    
    const dist = isSun ? host.size * 2.5 : host.size * 4.5 + 5;
    
    this.transition = {
      phase: 'zoom',
      progress: 0,
      duration: 0.7,
      startPos: this.camera.position.clone(),
      startTarget: this.controls.target.clone(),
      host,
      dist,
    };
  }
  
  enterDetail(detailScene, planet) {
    const d = detailScene.frameRadius;
    this.detailCamera.position.set(d * 0.5, d * 0.45, d * 1.1);
    this.detailCamera.lookAt(0, 0, 0);
    this.detailCamera.updateProjectionMatrix();
    
    this.controls.enabled = false;
    this.detailControls.enabled = true;
    this.detailControls.target.set(0, 0, 0);
    this.detailControls.minDistance = planet.size * 1.2;
    this.detailControls.maxDistance = detailScene.frameRadius * 4;
    this.detailControls.update();
  }
  
  leaveDetail() {
    this.detailControls.enabled = false;
    this.controls.enabled = true;
    if (this.returnPos) this.camera.position.copy(this.returnPos);
    if (this.returnTarget) this.controls.target.copy(this.returnTarget);
    this.controls.minDistance = 50;
    this.controls.maxDistance = 1000;
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
    this.controls.update();
    
    this.returnPos = null;
    this.returnTarget = null;
  }
  
  exitDetail() {
    if (this.transition) return;
    this.transition = { phase: 'cover', progress: 0, duration: 0.18 };
  }

  enterCompare(compareScene) {
    this.detailControls.enabled = true;
    this.controls.enabled = false;
    this.detailControls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY };
    this.detailControls.enablePan = false;
    this.frameCompare(compareScene);
  }

  frameCompare(compareScene) {
    const half = compareScene.totalWidth / 2 || 3;
    const dist = Math.max(half * 2.2, 6);
    this.detailControls.target.set(0, 0, 0);
    this.detailControls.minDistance = 2;
    this.detailControls.maxDistance = Math.max(50, dist * 3);
    this.detailCamera.position.set(0, half * 0.4, dist);
    this.detailCamera.lookAt(0, 0, 0);
    this.detailCamera.updateProjectionMatrix();
    this.detailControls.update();
  }

  leaveCompare() {
    this.moonFocus = null;
    this.detailControls.enabled = false;
    this.controls.enabled = true;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 1000;
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
    this.controls.update();
  }
  
  setMoonFocus(moonMesh, host, isDetail) {
    if (this.transition) return;
    
    const cam = isDetail ? this.detailCamera : this.camera;
    const controls = isDetail ? this.detailControls : this.controls;
    
    const zoomDist = Math.max(moonMesh.size * 7, 0.3);
    this.moonFocus = {
      mesh: moonMesh,
      host,
      isDetail,
      savedPos: cam.position.clone(),
      savedTarget: controls.target.clone(),
      zoomDist,
      minDist: Math.max(moonMesh.size * 3, 0.15),
      maxDist: Math.max(moonMesh.size * 60, 15),
    };
    
    controls.enabled = false;
    
    this.transition = {
      phase: 'moonZoom',
      progress: 0,
      duration: 0.8,
      startPos: cam.position.clone(),
      startTarget: controls.target.clone(),
    };
    
    return this.moonFocus;
  }
  
  handleMoonWheel(event) {
    if (!this.moonFocus || this.transition) return;
    const focus = this.moonFocus;
    const factor = event.deltaY > 0 ? 1.15 : 1 / 1.15;
    const min = focus.minDist;
    const max = focus.maxDist;
    focus.zoomDist = Math.min(max, Math.max(min, focus.zoomDist * factor));
    event.preventDefault();
  }
  
  updateMoonFocus() {
    const focus = this.moonFocus;
    if (!focus || this.transition) return;
    
    const cam = focus.isDetail ? this.detailCamera : this.camera;
    const controls = focus.isDetail ? this.detailControls : this.controls;
    const moonPos = focus.mesh.getWorldPosition(new THREE.Vector3());
    const hostPos = focus.host.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3().subVectors(moonPos, hostPos);
    
    if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0);
    dir.normalize();
    
    const targetPos = moonPos.clone().addScaledVector(dir, focus.zoomDist);
    cam.position.lerp(targetPos, 0.1);
    cam.up.set(0, 1, 0);
    cam.lookAt(moonPos);
    controls.target.lerp(moonPos, 0.1);
  }
  
  exitMoonFocus() {
    const focus = this.moonFocus;
    if (!focus) return;
    
    const cam = focus.isDetail ? this.detailCamera : this.camera;
    const controls = focus.isDetail ? this.detailControls : this.controls;
    
    if (this.transition && this.transition.phase === 'moonZoom') {
      this.transition = null;
    }
    
    cam.position.copy(focus.savedPos);
    controls.target.copy(focus.savedTarget);
    controls.enabled = true;
    controls.update();
    
    this.moonFocus = null;
  }
  
  updateTransition(deltaTime, fadeEl, onZoomComplete, onCoverComplete, onUncoverComplete) {
    if (!this.transition) {
      // Safety: ensure fade is transparent when no transition
      if (fadeEl && fadeEl.style.opacity !== '0') {
        fadeEl.style.opacity = '0';
      }
      return;
    }
    
    this.transition.progress += deltaTime / this.transition.duration;
    const t = this.easeOutCubic(Math.min(this.transition.progress, 1));
    
    if (this.transition.phase === 'zoom') {
      const offset = new THREE.Vector3();
      offset.set(
        this.transition.host.position.x,
        this.transition.host.position.y + this.transition.dist * 0.4,
        this.transition.host.position.z + this.transition.dist
      );
      this.camera.position.lerpVectors(this.transition.startPos, offset, t);
      this.controls.target.lerpVectors(
        this.transition.startTarget,
        new THREE.Vector3(this.transition.host.position.x, this.transition.host.position.y, this.transition.host.position.z),
        t
      );
      this.camera.lookAt(
        this.transition.host.position.x,
        this.transition.host.position.y,
        this.transition.host.position.z
      );
      if (this.transition.progress >= 1) {
        fadeEl.style.opacity = 1;
        onZoomComplete();
        this.transition = { phase: 'uncover', progress: 0, duration: 0.5 };
      }
    } else if (this.transition.phase === 'cover') {
      fadeEl.style.opacity = String(t);
      if (this.transition.progress >= 1) {
        fadeEl.style.opacity = '1';
        onCoverComplete();
        this.transition = { phase: 'uncover', progress: 0, duration: 0.5 };
      }
    } else if (this.transition.phase === 'uncover') {
      fadeEl.style.opacity = String(1 - t);
      if (this.transition.progress >= 1) {
        fadeEl.style.opacity = '0';
        this.transition = null;
        onUncoverComplete();
      }
    } else if (this.transition.phase === 'moonZoom') {
      const focus = this.moonFocus;
      if (!focus) {
        this.transition = null;
        return;
      }
      const cam = focus.isDetail ? this.detailCamera : this.camera;
      const controls = focus.isDetail ? this.detailControls : this.controls;
      const moonPos = focus.mesh.getWorldPosition(new THREE.Vector3());
      const hostPos = focus.host.getWorldPosition(new THREE.Vector3());
      const dir = new THREE.Vector3().subVectors(moonPos, hostPos);
      if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0);
      dir.normalize();
      const targetPos = moonPos.clone().addScaledVector(dir, focus.zoomDist);
      cam.up.set(0, 1, 0);
      cam.position.lerpVectors(this.transition.startPos, targetPos, t);
      controls.target.lerpVectors(this.transition.startTarget, moonPos, t);
      cam.lookAt(moonPos);
      if (this.transition.progress >= 1) {
        this.transition = null;
      }
    }
  }
  
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  
  update(deltaTime) {
    this.controls.update();
    this.detailControls.update();
  }
  
  getActiveCamera(detailActive) {
    return detailActive ? this.detailCamera : this.camera;
  }
  
  getActiveControls(detailActive) {
    return detailActive ? this.detailControls : this.controls;
  }
  
  render(detailActive, scene, detailScene) {
    if (detailActive) {
      this.detailControls.update();
      this.renderer.render(detailScene, this.detailCamera);
    } else {
      this.controls.update();
      this.renderer.render(scene, this.camera);
    }
  }
}