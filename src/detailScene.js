import * as THREE from 'three';
import { PlanetRing, createOrbitPath, generateRingTexture, setOrbitPathThickness } from './celestialObjects.js';
import { createStarfield } from './starfield.js';
import { PLANET_DATA } from './planetData.js';
import { textureLoader } from './resources.js';

export const MOON_DATA = {
  Sun: [],
  Mercury: [],
  Venus: [],
  Earth: [
    { name: 'Moon', texture: 'moon.jpg', size: 0.3, orb: 4, speed: 2420000 },
  ],
  Mars: [
    { name: 'Phobos', texture: 'phobos.jpg', size: 0.09, orb: 2.9, speed: 2138000 },
    { name: 'Deimos', texture: 'deimos.jpg', size: 0.08, orb: 4.5, speed: 1350000 },
  ],
  Jupiter: [
    { name: 'Io', texture: 'io.jpg', size: 0.13, orb: 4.5, speed: 17334000 },
    { name: 'Europa', texture: 'europa.jpg', size: 0.11, orb: 7, speed: 10340000 },
    { name: 'Ganymede', texture: 'ganymede.jpg', size: 0.18, orb: 10, speed: 7145000 },
    { name: 'Callisto', texture: 'callisto.jpg', size: 0.16, orb: 14, speed: 4356000 },
  ],
  Saturn: [
    { name: 'Mimas', texture: 'mimas.jpg', size: 0.1, orb: 3.2, speed: 4310000 },
    { name: 'Enceladus', texture: 'enceladus.jpg', size: 0.1, orb: 4, speed: 3135000 },
    { name: 'Tethys', texture: 'tethys.jpg', size: 0.12, orb: 5, speed: 2210000 },
    { name: 'Dione', texture: 'dione.jpg', size: 0.12, orb: 6.4, speed: 1640000 },
    { name: 'Rhea', texture: 'rhea.jpg', size: 0.14, orb: 8.5, speed: 1125000 },
    { name: 'Titan', texture: 'titan.jpg', size: 0.22, orb: 14, speed: 604000 },
    { name: 'Iapetus', texture: 'iapetus.jpg', size: 0.14, orb: 15, speed: 520000 },
  ],
  Uranus: [
    { name: 'Miranda', texture: 'miranda.jpg', size: 0.09, orb: 3.2, speed: 1000000 },
    { name: 'Ariel', texture: 'ariel.jpg', size: 0.11, orb: 4.4, speed: 750000 },
    { name: 'Umbriel', texture: 'umbriel.jpg', size: 0.11, orb: 5.6, speed: 540000 },
    { name: 'Titania', texture: 'titania.jpg', size: 0.14, orb: 7.5, speed: 400000 },
    { name: 'Oberon', texture: 'oberon.jpg', size: 0.14, orb: 9.5, speed: 315000 },
  ],
  Neptune: [
    { name: 'Triton', texture: 'triton.jpg', size: 0.16, orb: 5.5, speed: 1050000 },
    { name: 'Nereid', texture: null, size: 0.09, orb: 9, speed: 210000 },
  ],
};

export class DetailScene {
  constructor(planet) {
    this.name = planet.name;
    this.scene = new THREE.Scene();
    createStarfield(this.scene);

    this.group = new THREE.Group();
    this.group.name = 'DetailGroup';
    this.scene.add(this.group);

    this.planetObj = this.buildPlanet(planet);
    this.moons = this.buildMoons(planet);
    this.ring = this.buildRing();
    this.frameRadius = planet.size * 1.3;

    if (this.ring) {
      this.frameRadius = Math.max(this.frameRadius, this.ring.geometry.parameters.outerRadius);
    }
    for (const moon of this.moons) {
      this.frameRadius = Math.max(this.frameRadius, moon.orb);
    }
    this.frameRadius = this.frameRadius * 1.25 + planet.size;

    this.sun = this.buildSun();
    this.rotationSpeed = planet.rotationSpeed || 0;
  }

  buildPlanet(planet) {
    const geometry = new THREE.SphereGeometry(planet.size, 24, 24);
    const material = new THREE.MeshBasicMaterial({ map: planet.material.map });
    material.generateMipmaps = true;
    material.minFilter = THREE.LinearMipmapLinearFilter;
    const copy = new THREE.Mesh(geometry, material);
    copy.name = planet.name;
    copy.size = planet.size;
    copy.orbitRadius = planet.orbitRadius || 0;
    copy.rotationSpeed = planet.rotationSpeed;
    copy.axisTilt = planet.axisTilt ?? 0;
    copy.rotation.set(THREE.MathUtils.degToRad(planet.axisTilt ?? 0), 0, 0);
    this.group.add(copy);
    return copy;
  }

  buildMoons(planet) {
    const moons = [];
    const config = MOON_DATA[planet.name] ?? [];
    const moonOrbitGroup = new THREE.Group();
    moonOrbitGroup.name = 'MoonOrbitGroup';
    moonOrbitGroup.rotation.x = THREE.MathUtils.degToRad(planet.axisTilt ?? 0);
    this.group.add(moonOrbitGroup);
    this.moonOrbitGroup = moonOrbitGroup;
    for (const spec of config) {
      const size = planet.size * spec.size;
      const orb = planet.size * spec.orb;
      const material = spec.texture
        ? new THREE.MeshBasicMaterial({ map: textureLoader.load('./static/images/' + spec.texture) })
        : new THREE.MeshBasicMaterial({ map: generateMoonTexture() });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), material);
      mesh.name = spec.name;
      mesh.size = size;
      mesh.userData.isMoon = true;
      mesh.rotation.x = THREE.MathUtils.degToRad(20 + Math.random() * 40);
      moonOrbitGroup.add(mesh);

      const path = createOrbitPath(orb, '#5a6a8a', 0.12, 0);
      path.userData.planet = { name: spec.name, color: '#5a6a8a' };
      path.userData.isMoon = true;
      path.userData.moonName = spec.name;
      moonOrbitGroup.add(path);

      moons.push({
        mesh,
        ring: path,
        orb,
        phase: Math.random() * Math.PI * 2,
        speed: spec.speed * 5e-8,
      });
    }
    return moons;
  }

  buildRing() {
    if (this.name === 'Saturn') {
      const ring = new PlanetRing(this.planetObj, 1.2, 2.3, generateRingTexture());
      this.group.add(ring);
      return ring;
    }
    if (this.name === 'Uranus') {
      const ring = new PlanetRing(this.planetObj, 1.6, 1.8, generateRingTexture({ r: 138, g: 160, b: 178, alpha: 0.42 }));
      this.group.add(ring);
      return ring;
    }
    if (this.name === 'Neptune') {
      const ring = new PlanetRing(this.planetObj, 1.68, 2.62, generateRingTexture({ r: 90, g: 105, b: 140, alpha: 0.4 }));
      this.group.add(ring);
      return ring;
    }
    return null;
  }

  buildSun() {
    if (this.name === 'Sun') return null;
    const size = this.planetObj.size * 0.5;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 24, 24),
      new THREE.MeshBasicMaterial({ map: textureLoader.load('./static/images/sun.jpg') })
    );
    mesh.name = 'Sun';
    const sunDist = this.frameRadius * 3 + this.planetObj.orbitRadius * 0.1;
    const angle = Math.PI / 4;
    mesh.position.set(sunDist * Math.cos(angle), this.frameRadius * 0.5, -sunDist * Math.sin(angle));
    this.group.add(mesh);
    return mesh;
  }

  update(deltaTime, camera = null, inMoonFocus = false) {
    this.planetObj.rotation.y += this.rotationSpeed * deltaTime;
    for (const moon of this.moons) {
      moon.phase += moon.speed * deltaTime;
      moon.mesh.position.x = Math.cos(moon.phase) * moon.orb;
      moon.mesh.position.y = 0;
      moon.mesh.position.z = Math.sin(moon.phase) * moon.orb;
      moon.mesh.rotation.y += 0.25 * deltaTime;
    }
    this.updateMoonRingThickness(camera, inMoonFocus);
    if (this.sun) this.sun.rotation.y += 0.05 * deltaTime;
    this.ring?.update();
  }

  updateMoonRingThickness(camera, inMoonFocus) {
    if (!camera) return;
    const factor = inMoonFocus ? 0.12 : 1;
    const dist = camera.position.length();
    for (const moon of this.moons) {
      const thickness = THREE.MathUtils.clamp(dist * 0.006 * factor, 0.05 * factor, moon.orb * 0.06);
      const last = moon.ring.userData.lastThickness;
      if (last == null || Math.abs(thickness - last) / thickness > 0.12) {
        setOrbitPathThickness(moon.ring, thickness);
        moon.ring.userData.lastThickness = thickness;
      }
    }
  }
}

function generateMoonTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, 128, 64);

  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 64;
    const r = Math.random() * 3 + 0.5;
    const b = 0.65 + Math.random() * 0.7;
    ctx.fillStyle = `rgba(${Math.round(125 * b)}, ${Math.round(125 * b)}, ${Math.round(135 * b)}, 0.55)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}