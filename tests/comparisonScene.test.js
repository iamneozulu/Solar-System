import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTexture = { type: 'Texture', image: {} };
const mockLoader = { load: vi.fn(() => mockTexture) };

vi.mock('three', () => {
  const THREE = {};

  class MockObject3D {
    constructor() {
      this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
      this.rotation = { x: 0, y: 0, z: 0 };
      this.userData = {};
      this.name = '';
      this.children = [];
      this.renderOrder = 0;
      this.scale = { x: 1, y: 1, z: 1, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
    }
    add(child) { this.children.push(child); }
    remove(child) {
      const i = this.children.indexOf(child);
      if (i >= 0) this.children.splice(i, 1);
    }
  }

  class MockMesh extends MockObject3D {
    constructor(geometry, material) {
      super();
      this.geometry = geometry;
      this.material = material;
      this.type = 'Mesh';
    }
  }

  class MockGroup extends MockObject3D {
    constructor() { super(); this.type = 'Group'; }
  }

  class MockSprite extends MockObject3D {
    constructor(material) { super(); this.material = material; this.type = 'Sprite'; }
  }

  class MockPoints extends MockObject3D {
    constructor(geometry, material) {
      super();
      this.geometry = geometry;
      this.material = material;
      this.type = 'Points';
      this.raycast = () => {};
    }
  }

  THREE.Mesh = MockMesh;
  THREE.Group = MockGroup;
  THREE.Sprite = MockSprite;
  THREE.Points = MockPoints;
  THREE.Scene = class extends MockObject3D {
    constructor() { super(); this.background = null; }
  };
  THREE.Color = function(hex) { return { hex }; };
  THREE.SphereGeometry = function(radius, w, h) { return { type: 'SphereGeometry', radius, widthSegments: w, heightSegments: h }; };
  THREE.MeshBasicMaterial = function(opts) { return { type: 'MeshBasicMaterial', ...opts }; };
  THREE.SpriteMaterial = function(opts) { return { type: 'SpriteMaterial', ...opts }; };
  THREE.CanvasTexture = function(c) { return { image: c, wrapS: null, wrapT: null, repeat: { set: () => {} } }; };
  THREE.RepeatWrapping = Symbol('RepeatWrapping');
  THREE.DoubleSide = Symbol('DoubleSide');
  THREE.LinearMipmapLinearFilter = Symbol('LinearMipmapLinearFilter');
  THREE.LoadingManager = function() { return { onProgress: () => {}, onLoad: () => {} }; };
  THREE.TextureLoader = function() { return mockLoader; };
  THREE.BufferGeometry = function() {
    return {
      type: 'BufferGeometry',
      setAttribute: vi.fn(),
      setFromPoints: vi.fn(() => ({ type: 'BufferGeometry' })),
    };
  };
  THREE.BufferAttribute = function(arr, size) { return { array: arr, itemSize: size }; };
  THREE.PointsMaterial = function(opts) { return { type: 'PointsMaterial', ...opts }; };
  THREE.CatmullRomCurve3 = function(points) { return { points }; };
  THREE.TubeGeometry = function(...args) { return { type: 'TubeGeometry', args }; };
  THREE.RingGeometry = function(inner, outer, seg) { return { type: 'RingGeometry', inner, outer, segments: seg }; };
  THREE.MathUtils = { degToRad: (d) => d * Math.PI / 180 };
  THREE.Vector3 = class {
    constructor(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; }
    clone() { return new THREE.Vector3(this.x, this.y, this.z); }
  };

  return { default: THREE, ...THREE };
});

global.document = {
  createElement: vi.fn(() => ({
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({
      createImageData: vi.fn((w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })),
      putImageData: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
    })),
  })),
};

const three = await import('three');
const { ...comp } = await import('../src/comparisonScene.js');

describe('bodyDisplayRadius', () => {
  it('is a positive number for every body', () => {
    const bodies = comp.buildBodyList();
    const largest = Math.max(...bodies.map((b) => b.km));
    for (const body of bodies) {
      expect(comp.bodyDisplayRadius(body.km, largest)).toBeGreaterThan(0);
      expect(Number.isFinite(comp.bodyDisplayRadius(body.km, largest))).toBe(true);
    }
  });

  it('keeps ordering consistent with real radii', () => {
    const bodyList = comp.buildBodyList().filter((b) => b.name !== 'Sun');
    const largest = Math.max(...bodyList.map((b) => b.km));
    const byDisplay = [...bodyList].sort((a, b) => comp.bodyDisplayRadius(a.km, largest) - comp.bodyDisplayRadius(b.km, largest));
    const byReal = [...bodyList].sort((a, b) => a.km - b.km);
    expect(byDisplay.map((b) => b.name)).toEqual(byReal.map((b) => b.name));
  });

  it('preserves exact proportional sizes', () => {
    const sun = comp.bodyDisplayRadius(695700, 695700);
    const earth = comp.bodyDisplayRadius(6371, 695700);
    expect(sun).toBeCloseTo(comp.MAX_DISPLAY_RADIUS, 6);
    expect(sun / earth).toBeCloseTo(695700 / 6371, 6);

    const moon = comp.bodyDisplayRadius(1737, 695700);
    expect(earth / moon).toBeCloseTo(6371 / 1737, 6);
  });
});

describe('layoutRow', () => {
  it('returns a centered layout', () => {
    const radii = [1, 2, 3];
    const centers = comp.layoutRow(radii, 0.5);
    const span = 1 * 2 + 0.5 + 2 * 2 + 0.5 + 3 * 2;
    expect(centers[centers.length - 1]).toBeCloseTo(span / 2 - 3);
    expect(centers[0]).toBeCloseTo(1 - span / 2);
  });

  it('does not overlap bodies', () => {
    const radii = [0.3, 1.1, 0.7, 2.2, 0.05];
    const centers = comp.layoutRow(radii, 0.25);
    const sortedIdx = [...centers].map((c, i) => i).sort((a, b) => centers[a] - centers[b]);
    for (let i = 1; i < sortedIdx.length; i++) {
      const prev = sortedIdx[i - 1];
      const cur = sortedIdx[i];
      const dist = centers[cur] - centers[prev];
      expect(dist).toBeGreaterThanOrEqual(radii[cur] + radii[prev]);
    }
  });

  it('empty layout produces empty centers', () => {
    expect(comp.layoutRow([], 0.5)).toEqual([]);
  });
});

describe('totalRowWidth', () => {
  it('computes total width', () => {
    const radii = [1, 2];
    expect(comp.totalRowWidth(radii, 0.5)).toBeCloseTo(2 + 0.5 + 4);
  });

  it('is zero for no bodies', () => {
    expect(comp.totalRowWidth([], 0.5)).toBe(0);
  });
});

describe('buildBodyList', () => {
  it('includes the Sun and every planet', () => {
    const names = comp.buildBodyList().map((b) => b.name);
    expect(names).toContain('Sun');
    for (const name of ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']) {
      expect(names).toContain(name);
    }
  });

  it('includes every moon from MOON_DATA with real radii', () => {
    const bodyList = comp.buildBodyList();
    const byName = Object.fromEntries(bodyList.map((b) => [b.name, b]));
    expect(byName.Moon).toBeDefined();
    expect(byName.Moon.km).toBeCloseTo(1737, 0);
    expect(byName.Ganymede).toBeDefined();
    expect(byName.Ganymede.km).toBeCloseTo(2634, 0);
    expect(byName.Deimos).toBeDefined();
    expect(byName.Deimos.host).toBe('Mars');
  });
});

describe('ComparisonScene', () => {
  let scene;

  beforeEach(() => {
    vi.clearAllMocks();
    scene = new comp.ComparisonScene();
  });

  it('uses a white background', () => {
    expect(scene.scene.background).toBeDefined();
    expect(scene.scene.background.hex).toBe(0xffffff);
  });

  it('lays out selected bodies without overlap', () => {
    scene.setSelected(new Set(['Sun', 'Earth', 'Moon']));
    const meshes = scene.meshes.filter((m) => m.userData.isCompareBody);
    expect(meshes.length).toBe(3);

    const placed = meshes
      .map((m) => ({ x: m.position.x, r: m.geometry.radius }))
      .sort((a, b) => a.x - b.x);

    for (let i = 1; i < placed.length; i++) {
      const dist = placed[i].x - placed[i - 1].x;
      expect(dist).toBeGreaterThanOrEqual(placed[i].r + placed[i - 1].r);
    }
  });

  it('adds a label under every body', () => {
    scene.setSelected(new Set(['Earth']));
    const labels = scene.labels.filter((l) => l.userData.isCompareLabel);
    expect(labels.length).toBe(1);
    expect(labels[0].position.x).toBeCloseTo(scene.meshes[0].position.x);
  });

  it('supports deselecting all bodies without errors', () => {
    expect(() => scene.setSelected(new Set())).not.toThrow();
    expect(scene.meshes.length).toBe(0);
    expect(scene.totalWidth).toBe(0);
  });

  it('marks bodies so they can be identified for hover', () => {
    scene.setSelected(new Set(['Earth']));
    const mesh = scene.meshes[0];
    expect(mesh.userData.isCompareBody).toBe(true);
    expect(mesh.userData.bodyName).toBe('Earth');
  });

  it('sets a slow rotation on the Sun', () => {
    scene.setSelected(new Set(['Sun']));
    expect(scene.meshes[0].userData.rotationSpeed).toBeGreaterThan(0);
    const init = scene.meshes[0].rotation.y;
    scene.update(0.1);
    expect(scene.meshes[0].rotation.y).toBe(init + 0.05 * 0.1);
  });
});