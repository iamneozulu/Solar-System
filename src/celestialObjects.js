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
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const imageData = ctx.createImageData(8, 512);
  const data = imageData.data;

  for (let y = 0; y < 512; y++) {
    const t = y / 512;
    let brightness = 0;

    if (t < 0.03) {
      brightness = 0;
    } else if (t < 0.08) {
      brightness = 0.15 + 0.1 * Math.sin(t * 200);
    } else if (t < 0.12) {
      brightness = 0.05;
    } else if (t < 0.35) {
      brightness = 0.5 + 0.25 * Math.sin(t * 80);
    } else if (t < 0.38) {
      const gap = (t - 0.35) / 0.03;
      brightness = 0.6 * (1 - gap);
    } else if (t < 0.68) {
      brightness = 0.7 + 0.25 * Math.sin(t * 120 + 0.5);
    } else if (t < 0.72) {
      brightness = 0.05 + 0.1 * Math.sin(t * 300);
    } else if (t < 0.93) {
      brightness = 0.4 + 0.3 * Math.sin(t * 90 + 1);
      const fade = 1 - (t - 0.93) / 0.07;
      brightness *= Math.max(0, fade);
    } else {
      brightness = 0;
    }

    const warm = Math.min(1, 0.8 + brightness * 0.3);
    const r = Math.min(255, Math.round(200 + brightness * 55 * warm));
    const g = Math.min(255, Math.round(180 + brightness * 75 * warm * 0.9));
    const b = Math.min(255, Math.round(150 + brightness * 105 * 0.7));

    for (let x = 0; x < 8; x++) {
      const idx = (y * 8 + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = Math.min(255, Math.round(brightness * 255));
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  return texture;
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

export function createOrbitPath(orbitRadius, color = '#444466') {
  const curve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius);
  const points = curve.getPoints(100);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: new THREE.Color(color), opacity: 0.25, transparent: true });
  const ellipse = new THREE.LineLoop(geometry, material);
  ellipse.userData.isOrbitPath = true;
  ellipse.rotation.x = Math.PI / 2;
  return ellipse;
}
