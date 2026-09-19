import * as THREE from 'three';
import { PLANET_DATA } from './planetData.js';
import { MOON_INFO } from './moonData.js';
import { PLANET_RADII_KM } from './scaleData.js';
import { MOON_RATIOS } from './scaleData.js';
import { MOON_DATA } from './detailScene.js';
import { textureLoader } from './resources.js';

export const MAX_DISPLAY_RADIUS = 1.5;
export const ROW_GAP = 0.35;

export function bodyDisplayRadius(radiusKm, largestKm) {
  const factor = MAX_DISPLAY_RADIUS / (largestKm || MAX_DISPLAY_RADIUS);
  return radiusKm * factor;
}

export function buildBodyList() {
  const list = [];
  list.push({
    name: 'Sun',
    km: PLANET_RADII_KM.Sun,
    host: null,
    color: PLANET_DATA.Sun.color,
    texture: './static/images/sun.jpg',
  });

  const PLANET_ORDER = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  for (const name of PLANET_ORDER) {
    list.push({
      name,
      km: PLANET_RADII_KM[name],
      host: null,
      color: PLANET_DATA[name].color,
      texture: `./static/images/${name.toLowerCase()}.jpg`,
    });
  }

  for (const [host, moons] of Object.entries(MOON_DATA)) {
    if (!PLANET_RADII_KM[host]) continue;
    for (const moon of moons) {
      const ratio = MOON_RATIOS[moon.name];
      const km = ratio ? ratio.size * PLANET_RADII_KM[host] : 0;
      list.push({
        name: moon.name,
        km,
        host,
        color: MOON_INFO[moon.name]?.color || '#5a6a8a',
        texture: moon.texture ? `./static/images/${moon.texture}` : null,
      });
    }
  }
  return list;
}

export function layoutRow(radii, gap = ROW_GAP) {
  const centers = [];
  let cursor = 0;
  for (const r of radii) {
    centers.push(cursor + r);
    cursor += r * 2 + gap;
  }
  const total = Math.max(cursor - gap, 0);
  const offset = total / 2;
  return centers.map((c) => c - offset);
}

export function totalRowWidth(radii, gap = ROW_GAP) {
  if (!radii.length) return 0;
  let cursor = 0;
  for (const r of radii) cursor += r * 2 + gap;
  return cursor - gap;
}

export class ComparisonScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.bodies = buildBodyList();
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.meshes = [];
    this.labels = [];
    this.totalWidth = 0;
  }

  setSelected(names) {
    while (this.group.children.length) {
      this.group.remove(this.group.children[0]);
    }
    this.meshes = [];
    this.labels = [];

    const items = this.bodies
      .filter((b) => names.has(b.name))
      .sort((a, b) => a.km - b.km);

    const largestKm = items.length ? items[items.length - 1].km : 0;
    const radii = items.map((b) => bodyDisplayRadius(b.km, largestKm));
    const gap = this.gapFor(radii);
    const centers = layoutRow(radii, gap);
    const widths = this.labelWidthsFor(radii, gap);

    for (let i = 0; i < items.length; i++) {
      const body = items[i];
      const mesh = this.buildBodyMesh(body, radii[i]);
      mesh.position.x = centers[i];
      this.group.add(mesh);
      this.meshes.push(mesh);

      const label = this.buildLabel(body.name, widths[i], body.color);
      label.position.set(centers[i], -(radii[i] + 0.55), 0);
      this.group.add(label);
      this.labels.push(label);
    }

    this.totalWidth = totalRowWidth(radii, gap);
  }

  gapFor(radii) {
    const max = Math.max(...radii, 0);
    return Math.max(ROW_GAP, max * 0.08);
  }

  labelWidthsFor(radii, gap) {
    const widths = [];
    for (let i = 0; i < radii.length; i++) {
      const left = i > 0 ? radii[i] + radii[i - 1] + gap : Infinity;
      const right = i < radii.length - 1 ? radii[i] + radii[i + 1] + gap : Infinity;
      const room = Math.min(left, right);
      widths.push(Math.max(0.4, Math.min(2.6, room * 0.95)));
    }
    return widths;
  }

  buildBodyMesh(body, radius) {
    const geometry = new THREE.SphereGeometry(radius, 24, 24);
    let material;
    if (body.texture) {
      material = new THREE.MeshBasicMaterial({ map: textureLoader.load(body.texture) });
    } else {
      const tex = generateBodyTexture(body.color || '#8a8a8a');
      material = new THREE.MeshBasicMaterial({ map: tex });
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = body.name;
    mesh.userData.isCompareBody = true;
    mesh.userData.bodyName = body.name;
    mesh.userData.rotationSpeed = body.name === 'Sun' ? 0.05 : 0;
    return mesh;
  }

  buildLabel(name, width, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color || '#333333';
    ctx.fillText(name, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(width, width * 0.25, 1);
    sprite.renderOrder = 10;
    sprite.userData.isCompareLabel = true;
    return sprite;
  }

  update(deltaTime) {
    for (const mesh of this.meshes) {
      if (mesh.userData.rotationSpeed) {
        mesh.rotation.y += mesh.userData.rotationSpeed * deltaTime;
      }
    }
  }
}

export function generateBodyTexture(baseColor = '#8a8a8a') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 128);

  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 128;
    const r = Math.random() * 4 + 0.5;
    const brightness = 0.65 + Math.random() * 0.7;
    const jitter = Math.round(brightness * 90);
    ctx.fillStyle = `rgba(${128 + jitter}, ${128 + jitter}, ${136 + jitter}, 0.55)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}