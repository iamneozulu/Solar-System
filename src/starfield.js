import * as THREE from 'three';

export function createStarfield(scene) {
  const bgTexture = generateBackgroundTexture();
  bgTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = bgTexture;

  const stars = createStarPoints(10000);
  scene.add(stars);

  return stars;
}

function generateBackgroundTexture(width = 2048, height = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  const nebulaColors = [
    { r: 0.4, g: 0.1, b: 0.6, a: 0.008 },
    { r: 0.1, g: 0.15, b: 0.5, a: 0.005 },
    { r: 0.5, g: 0.1, b: 0.05, a: 0.004 },
  ];

  for (const nebula of nebulaColors) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const r = 200 + Math.random() * 400;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${nebula.r * 255},${nebula.g * 255},${nebula.b * 255},${nebula.a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createStarPoints(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const radius = 2500;

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const temp = Math.random();
    if (temp < 0.6) {
      const b = 0.6 + Math.random() * 0.4;
      colors[i * 3] = b;
      colors[i * 3 + 1] = b;
      colors[i * 3 + 2] = b + Math.random() * 0.15;
    } else if (temp < 0.8) {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.75 + Math.random() * 0.25;
      colors[i * 3 + 2] = 0.5 + Math.random() * 0.3;
    } else if (temp < 0.92) {
      colors[i * 3] = 0.7 + Math.random() * 0.3;
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
      colors[i * 3 + 2] = 1;
    } else {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.4 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.3 + Math.random() * 0.2;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'Starfield';
  points.raycast = () => {};
  return points;
}
