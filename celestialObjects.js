import * as THREE from './node_modules/three';

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
  constructor(planet, innerRadius, outerRadius) {
    const geometry = new THREE.RingGeometry(planet.size + innerRadius, planet.size + outerRadius, 24);
    const material = new THREE.MeshBasicMaterial({ color: 'lightgray', side: THREE.DoubleSide });
    super(geometry, material);
    this.planet = planet;
  }

  update() {
    this.position.x = this.planet.position.x;
    this.position.z = this.planet.position.z;
    this.rotation.x = THREE.MathUtils.degToRad(this.planet.axisTilt + 270);
  }
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

export function createOrbitPath(orbitRadius, color = 0x444466) {
  const curve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius);
  const points = curve.getPoints(100);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, opacity: 0.3, transparent: true });
  const ellipse = new THREE.LineLoop(geometry, material);
  ellipse.userData.isOrbitPath = true;
  ellipse.rotation.x = Math.PI / 2;
  return ellipse;
}
