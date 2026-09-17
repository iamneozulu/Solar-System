import * as THREE from 'three';
import { PlanetRing, createOrbitPath, generateRingTexture } from './celestialObjects.js';
import { createStarfield } from './starfield.js';

export const MOON_DATA = {
  Sun: [],
  Mercury: [],
  Venus: [],
  Earth: [
    { name: 'Moon', size: 0.42, orb: 2.3, speed: 0.9 },
  ],
  Mars: [
    { name: 'Phobos', size: 0.26, orb: 1.9, speed: 1.4 },
    { name: 'Deimos', size: 0.2, orb: 2.6, speed: 0.8 },
  ],
  Jupiter: [
    { name: 'Io', size: 0.85, orb: 1.9, speed: 1.1 },
    { name: 'Europa', size: 0.74, orb: 2.4, speed: 0.9 },
    { name: 'Ganymede', size: 1.1, orb: 2.9, speed: 0.7 },
    { name: 'Callisto', size: 1.0, orb: 3.5, speed: 0.5 },
  ],
  Saturn: [
    { name: 'Mimas', size: 0.42, orb: 2.1, speed: 1.3 },
    { name: 'Tethys', size: 0.56, orb: 2.6, speed: 1.0 },
    { name: 'Dione', size: 0.72, orb: 3.1, speed: 0.8 },
    { name: 'Titan', size: 1.05, orb: 3.8, speed: 0.5 },
  ],
  Uranus: [
    { name: 'Miranda', size: 0.48, orb: 1.9, speed: 1.2 },
    { name: 'Ariel', size: 0.62, orb: 2.4, speed: 0.9 },
    { name: 'Titania', size: 0.8, orb: 3.0, speed: 0.6 },
    { name: 'Oberon', size: 0.76, orb: 3.5, speed: 0.5 },
  ],
  Neptune: [
    { name: 'Triton', size: 0.9, orb: 2.4, speed: 0.7 },
    { name: 'Nereid', size: 0.5, orb: 3.3, speed: 0.4 },
  ],
};

export class DetailScene {
  constructor(planet, textureLoader) {
    this.name = planet.name;
    this.scene = new THREE.Scene();
    createStarfield(this.scene);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.planetObj = this.buildPlanet(planet);
    this.moons = this.buildMoons(planet);
    this.ring = this.buildRing(planet);
    this.frameRadius = planet.size * 1.3;

    if (this.ring) {
      this.frameRadius = Math.max(this.frameRadius, this.ring.geometry.parameters.outerRadius);
    }
    for (const moon of this.moons) {
      this.frameRadius = Math.max(this.frameRadius, moon.orb);
    }
    this.frameRadius = this.frameRadius * 1.25 + planet.size;

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
    copy.rotationSpeed = planet.rotationSpeed;
    copy.axisTilt = planet.axisTilt ?? 0;
    copy.rotation.set(THREE.MathUtils.degToRad(planet.axisTilt ?? 0), 0, 0);
    this.group.add(copy);
    return copy;
  }

  buildMoons(planet) {
    const moons = [];
    const config = MOON_DATA[planet.name] ?? [];
    for (const spec of config) {
      const size = planet.size * spec.size;
      const orb = planet.size * spec.orb;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 16, 16),
        new THREE.MeshBasicMaterial({ map: generateMoonTexture() })
      );
      mesh.name = spec.name;
      mesh.rotation.x = THREE.MathUtils.degToRad(20 + Math.random() * 40);
      this.group.add(mesh);
      this.group.add(createOrbitPath(orb, '#5a6a8a', 0.08));

      moons.push({
        mesh,
        orb,
        phase: Math.random() * Math.PI * 2,
        speed: spec.speed,
      });
    }
    return moons;
  }

  buildRing(planet) {
    if (planet.name === 'Saturn') {
      const ring = new PlanetRing(planet, 1, 5, generateRingTexture());
      this.group.add(ring);
      return ring;
    }
    if (planet.name === 'Uranus') {
      const ring = new PlanetRing(planet, 3, 4);
      this.group.add(ring);
      return ring;
    }
    return null;
  }

  update(deltaTime) {
    this.planetObj.rotation.y += this.rotationSpeed * deltaTime;
    for (const moon of this.moons) {
      moon.phase += moon.speed * deltaTime;
      moon.mesh.position.x = Math.cos(moon.phase) * moon.orb;
      moon.mesh.position.z = Math.sin(moon.phase) * moon.orb;
      moon.mesh.rotation.y += 0.25 * deltaTime;
    }
    this.ring?.update();
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