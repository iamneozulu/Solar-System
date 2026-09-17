import * as THREE from 'three';

export class Star extends THREE.Mesh {
  constructor(name, size, rotationSpeed, color, texture, textureLoader) {
    const mesh = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshBasicMaterial({ map: textureLoader.load(texture) });
    super(mesh, material);
    material.generateMipmaps = true;
    material.minFilter = THREE.LinearMipmapLinearFilter;
    this.name = name;
    this.size = size;
    this.rotationSpeed = rotationSpeed;
    this.color = color;
    this.texture = texture;
    this.rotation.y += 1;
  }

  update(deltaTime) {
    this.rotation.y += this.rotationSpeed * deltaTime;
  }
}

export class Planet extends THREE.Mesh {
  constructor(name, size, planetOrbit, distancePerYear, rotationSpeed, axisTilt, color, texture, textureLoader) {
    const planetMesh = new THREE.SphereGeometry(size, 24, 24);
    const planetTexture = new THREE.MeshBasicMaterial({ map: textureLoader.load(texture) });
    super(planetMesh, planetTexture);
    planetTexture.generateMipmaps = true;
    planetTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.name = name;
    this.size = size;
    this.orbitRadius = planetOrbit / 3000000;
    this.orbitSpeed = distancePerYear / 600000000000;
    this.rotationSpeed = rotationSpeed;
    this.axisTilt = axisTilt;
    this.color = color;
    this.texture = texture;
  }

  update(deltaTime, simTime) {
    this.position.x = this.orbitRadius * Math.cos(-this.orbitSpeed * simTime * 1000);
    this.position.z = this.orbitRadius * Math.sin(-this.orbitSpeed * simTime * 1000);
    this.rotation.x = THREE.MathUtils.degToRad(this.axisTilt);
    this.rotation.y += this.rotationSpeed * deltaTime;
  }

  isMoon() { return false; }
}

export class Moon extends THREE.Mesh {
  constructor(planet, name, size, orbitRadius, orbitSpeed, rotationSpeed, color, texture, textureLoader) {
    const moonMesh = new THREE.SphereGeometry(size, 16, 16);
    const moonTexture = new THREE.MeshBasicMaterial({ map: textureLoader.load(texture) });
    super(moonMesh, moonTexture);
    moonTexture.generateMipmaps = true;
    moonTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.name = name;
    this.planet = planet;
    this.size = size;
    this.orbitRadius = orbitRadius;
    this.orbitSpeed = orbitSpeed / 9000000;
    this.rotationSpeed = rotationSpeed;
    this.color = color;
    this.texture = texture;
  }

  update(deltaTime, simTime) {
    this.position.x = this.planet.position.x + this.orbitRadius * Math.cos(-this.orbitSpeed * simTime * 1000);
    this.position.z = this.planet.position.z + this.orbitRadius * Math.sin(-this.orbitSpeed * simTime * 1000);
  }

  isMoon() { return true; }
}

export class PlanetRing extends THREE.Mesh {
  constructor(planet, innerRadius, outerRadius, texture) {
    const geometry = new THREE.RingGeometry(planet.size + innerRadius, planet.size + outerRadius, 64);
    mapRingUVs(geometry);
    const materialOptions = { side: THREE.DoubleSide, transparent: true };
    if (texture) {
      materialOptions.map = texture;
    } else {
      materialOptions.color = 'lightgray';
    }
    const material = new THREE.MeshBasicMaterial(materialOptions);
    super(geometry, material);
    this.planet = planet;
  }

  update() {
    this.position.x = this.planet.position.x;
    this.position.z = this.planet.position.z;
    this.rotation.x = THREE.MathUtils.degToRad(this.planet.axisTilt + 270);
  }
}

export function generateRingTexture() {
  const W = 16;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const imageData = ctx.createImageData(W, H);
  const data = imageData.data;

  for (let y = 0; y < H; y++) {
    const t = y / H;
    const brightness = ringBrightness(t);

    const ir = Math.min(255, Math.round(210 + brightness * 50));
    const ig = Math.min(255, Math.round(185 + brightness * 55));
    const ib = Math.min(255, Math.round(150 + brightness * 70));
    const alpha = Math.min(255, Math.round(brightness * 255));

    for (let x = 0; x < W; x++) {
      const jitter = 0.88 + Math.random() * 0.24;
      const idx = (y * W + x) * 4;
      data[idx] = Math.min(255, Math.round(ir * jitter));
      data[idx + 1] = Math.min(255, Math.round(ig * jitter));
      data[idx + 2] = Math.min(255, Math.round(ib * jitter));
      data[idx + 3] = alpha;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

function ringBrightness(t) {
  if (t < 0.02) return 0;
  if (t < 0.1) return 0.35 + 0.2 * Math.sin(t * 130);
  if (t < 0.16) return 0.85 + 0.15 * Math.sin(t * 70);
  if (t < 0.2) return Math.max(0, 0.85 - (t - 0.16) / 0.04 * 0.7);
  if (t < 0.235) return 0.08;
  if (t < 0.34) return 0.55 + 0.3 * Math.sin(t * 60 + 0.5);
  if (t < 0.5) return 0.82 + 0.18 * Math.sin(t * 90);
  return Math.max(0, 0.7 * (1 - (t - 0.5) / 0.22));
}

function mapRingUVs(geometry) {
  const position = geometry.attributes && geometry.attributes.position;
  const uv = geometry.attributes && geometry.attributes.uv;
  if (!position || !uv) return;

  const params = geometry.parameters || {};
  const inner = params.innerRadius || 1;
  const outer = params.outerRadius || 4;
  const positions = position.array;
  const uvs = uv.array;

  for (let i = 0; i < position.count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const r = Math.sqrt(x * x + y * y);
    uvs[i * 2] = (Math.atan2(y, x) / (2 * Math.PI) + 0.5);
    uvs[i * 2 + 1] = (r - inner) / (outer - inner);
  }
  uv.needsUpdate = true;
}

export class AsteroidBelt extends THREE.Points {
  constructor(asteroidCount = 1500, innerRadius = 90, outerRadius = 110, color = 0xb2b2b2, size = 0.5) {
    const positions = new Float32Array(asteroidCount * 3);
    for (let i = 0; i < asteroidCount; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
      const height = (Math.random() - 0.5) * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color, size, sizeAttenuation: true });
    super(geometry, material);
    this.name = "AsteroidBelt";
    this.raycast = () => {};
  }

  update(deltaTime, speed = 0.001) {
    this.rotation.y += speed * deltaTime * 60;
  }
}

export function cameraOrbit(camera, planet, simTime) {
  camera.position.x = (planet.orbitRadius + 15) * Math.cos(-planet.orbitSpeed * simTime * 1000);
  camera.position.z = (planet.orbitRadius + 15) * Math.sin(-planet.orbitSpeed * simTime * 1000);
  camera.position.y = planet.position.y + 3;
}

export function createOrbitPath(orbitRadius, color = '#444466', thickness = null) {
  const segments = 128;
  const points = [];
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(orbitRadius * Math.cos(theta), 0, orbitRadius * Math.sin(theta)));
  }
  const curve = new THREE.CatmullRomCurve3(points, true);
  const tubeRadius = thickness ?? Math.max(0.4, orbitRadius * 0.004);
  const geometry = new THREE.TubeGeometry(curve, segments, tubeRadius, 8, true);
  const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), opacity: 0.55, transparent: true });
  const orbitPath = new THREE.Mesh(geometry, material);
  orbitPath.userData.isOrbitPath = true;
  return orbitPath;
}
