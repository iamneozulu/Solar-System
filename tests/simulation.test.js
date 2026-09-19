import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock document and window for canvas creation and CameraManager
global.document = {
  createElement: vi.fn(() => ({
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({
      createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(16 * 512 * 4) })),
      putImageData: vi.fn(),
    })),
  })),
  body: {
    innerHTML: '',
  },
  getElementById: vi.fn(() => ({
    style: {},
    classList: { add: vi.fn(), remove: vi.fn(), contains: vi.fn() },
    textContent: '',
    onclick: null,
    waitFor: vi.fn(),
    isVisible: vi.fn(() => true),
    isEnabled: vi.fn(() => true),
    click: vi.fn(),
    evaluate: vi.fn(),
  })),
  addEventListener: vi.fn(),
};

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
};

const mockTexture = { type: 'Texture', image: {} };
const mockLoader = { load: vi.fn(() => mockTexture) };

vi.mock('three', () => {
  const THREE = {};

  class MockObject3D {
    constructor() {
      this.position = { x: 0, y: 0, z: 0 };
      this.rotation = { x: 0, y: 0, z: 0 };
      this.userData = {};
      this.name = '';
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

  class MockPoints extends MockObject3D {
    constructor(geometry, material) {
      super();
      this.geometry = geometry;
      this.material = material;
      this.type = 'Points';
    }
  }

  class MockLineLoop extends MockObject3D {
    constructor(geometry, material) {
      super();
      this.geometry = geometry;
      this.material = material;
      this.type = 'LineLoop';
    }
  }

  THREE.Mesh = MockMesh;
  THREE.Points = MockPoints;
  THREE.SphereGeometry = function(r, w, h) { return { type: 'SphereGeometry', radius: r, widthSegments: w, heightSegments: h }; };
  THREE.RingGeometry = function(inner, outer, seg) { return { type: 'RingGeometry', inner, outer, segments: seg }; };
  THREE.BufferGeometry = function() {
    return {
      type: 'BufferGeometry',
      setAttribute: vi.fn(),
      setFromPoints: vi.fn(() => ({ type: 'BufferGeometry' })),
    };
  };
  THREE.BufferAttribute = function(arr, size) { return { array: arr, itemSize: size }; };
  THREE.MeshBasicMaterial = function(opts) { return { type: 'MeshBasicMaterial', ...opts }; };
  THREE.PointsMaterial = function(opts) { return { type: 'PointsMaterial', ...opts }; };
  THREE.LineBasicMaterial = function(opts) { return { type: 'LineBasicMaterial', ...opts }; };
  THREE.EllipseCurve = function(a, b, c, d) {
    return { getPoints: vi.fn(() => [{ x: 0, y: 0 }, { x: 1, y: 0 }]) };
  };
  THREE.CatmullRomCurve3 = function(points) { return { points }; };
  THREE.TubeGeometry = function(...args) { return { type: 'TubeGeometry', args }; };
  THREE.Vector3 = class {
    constructor(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; }
    clone() { return new THREE.Vector3(this.x, this.y, this.z); }
    lerp(target, alpha) { return this; }
    lerpVectors(a, b, t) { this.x = a.x + (b.x - a.x) * t; this.y = a.y + (b.y - a.y) * t; this.z = a.z + (b.z - a.z) * t; }
    subVectors(a, b) { this.x = a.x - b.x; this.y = a.y - b.y; this.z = a.z - b.z; return this; }
    addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    normalize() { return this; }
    lengthSq() { return 1; }
  };
  THREE.DoubleSide = Symbol('DoubleSide');
  THREE.LinearMipmapLinearFilter = Symbol('LinearMipmapLinearFilter');
  THREE.MathUtils = { degToRad: (d) => d * Math.PI / 180 };
  THREE.TextureLoader = function() { return mockLoader; };
  THREE.LoadingManager = function() { return { onProgress: () => {}, onLoad: () => {} }; };
  THREE.Color = function(hex) { return { hex }; };
  THREE.RepeatWrapping = Symbol('RepeatWrapping');
  THREE.ClampToEdgeWrapping = Symbol('ClampToEdgeWrapping');
  THREE.SRGBColorSpace = Symbol('SRGBColorSpace');
  THREE.AdditiveBlending = Symbol('AdditiveBlending');
  THREE.CanvasTexture = function(c) { return { image: c, colorSpace: null, wrapS: null, wrapT: null, repeat: { set: () => {} } }; };
  THREE.MOUSE = { ROTATE: 0, DOLLY: 1 };
  THREE.PerspectiveCamera = class MockPerspectiveCamera {
    constructor(fov, aspect, near, far) {
      this.fov = fov;
      this.aspect = aspect;
      this.near = near;
      this.far = far;
      this.position = { x: 170, y: 20, z: 2, set: vi.fn(), copy: vi.fn(), clone: vi.fn(() => ({ x: 170, y: 20, z: 2 })), lerp: vi.fn(), lerpVectors: vi.fn(), addScaledVector: vi.fn() };
      this.rotation = { x: 0, y: 0, z: 0 };
      this.up = { x: 0, y: 1, z: 0, set: vi.fn() };
      this.updateProjectionMatrix = vi.fn();
      this.lookAt = vi.fn();
    }
  };
  THREE.Raycaster = class MockRaycaster {
    constructor() {
      this.setFromCamera = vi.fn();
      this.intersectObjects = vi.fn(() => []);
    }
  };
  THREE.Scene = class MockScene {
    constructor() {
      this.children = [];
      this.add = vi.fn();
    }
  };
  THREE.Vector2 = class MockVector2 {
    constructor(x, y) {
      this.x = x || 0;
      this.y = y || 0;
    }
    set(x, y) { this.x = x; this.y = y; }
  };

  return { default: THREE, LineLoop: MockLineLoop, ...THREE };
});

vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: class MockOrbitControls {
    constructor(camera, domElement) {
      this.camera = camera;
      this.domElement = domElement;
      this.enabled = true;
      this.target = { x: 0, y: 0, z: 0, clone() { return { x: 0, y: 0, z: 0 }; }, copy() {}, lerp() {} };
      this.minDistance = 50;
      this.maxDistance = 1000;
      this.maxPolarAngle = Math.PI / 2;
      this.panSpeed = 1;
      this.mouseButtons = { LEFT: 0, MIDDLE: 1 };
      this.update = vi.fn();
    }
  }
}));

const THREE = await import('three');
const simulation = await import('../src/simulation.js');
const { CameraManager } = await import('../src/cameraManager.js');
const { UIController } = await import('../src/uiController.js');
const CELESTIAL = await import('../src/celestialObjects.js');

describe('Simulation', () => {
  it('creates all celestial bodies', () => {
    expect(simulation.simulation.Sun).toBeDefined();
    expect(simulation.simulation.planets.length).toBe(8);
    expect(simulation.simulation.Lunar).toBeDefined();
    expect(simulation.simulation.SaturnRing).toBeDefined();
    expect(simulation.simulation.UranusRing).toBeDefined();
    expect(simulation.simulation.asteroidBelt).toBeDefined();
    expect(simulation.simulation.kuiperBelt).toBeDefined();
    expect(simulation.simulation.orbitPaths.length).toBe(8);
  });

  it('updates simulation time', () => {
    const initialTime = simulation.simulation.simulationTime;
    simulation.simulation.update(0.016);
    expect(simulation.simulation.simulationTime).toBeCloseTo(initialTime + 0.016);
  });

  it('planets have correct orbit inclinations', () => {
    const earth = simulation.simulation.planets.find(p => p.name === 'Earth');
    expect(earth.orbitInclination).toBe(0);
    
    const mercury = simulation.simulation.planets.find(p => p.name === 'Mercury');
    expect(mercury.orbitInclination).toBe(7.005);
  });

  it('getAllObjects returns all objects', () => {
    const objects = simulation.simulation.getAllObjects();
    expect(objects.length).toBeGreaterThan(20);
  });

  it('getObjectByName finds correct objects', () => {
    const sun = simulation.simulation.getObjectByName('Sun');
    expect(sun).toBe(simulation.simulation.Sun);
    
    const mars = simulation.simulation.getObjectByName('Mars');
    expect(mars).toBeDefined();
    expect(mars.name).toBe('Mars');
  });
});

describe('Orbital Mechanics', () => {
  let planet, originalSimTime;

  beforeEach(() => {
    vi.clearAllMocks();
    planet = new CELESTIAL.Planet('Test', 2, 150000000, 942000000, 0.05, 23.5, '#4d9de0', 'test.jpg');
    originalSimTime = simulation.simulation.simulationTime;
  });

  it('calculates orbit radius correctly', () => {
    expect(planet.orbitRadius).toBeCloseTo(150000000 / 3000000);
  });

  it('calculates orbit speed correctly', () => {
    expect(planet.orbitSpeed).toBeCloseTo(942000000 / 3000000000000);
  });

  it('applies inclination to position', () => {
    planet.orbitInclination = 7;
    planet.update(0.016, 10);
    const angle = -planet.orbitSpeed * 10 * 3000;
    const expectedY = planet.orbitRadius * Math.sin(angle) * Math.sin(THREE.MathUtils.degToRad(7));
    expect(planet.position.y).toBeCloseTo(expectedY, 5);
  });

  it('inclination of 0 keeps orbit flat', () => {
    planet.orbitInclination = 0;
    planet.update(0.016, 10);
    expect(Math.abs(planet.position.y)).toBeLessThan(0.001);
  });

  it('rotation accumulates over time', () => {
    const initialY = planet.rotation.y;
    planet.update(0.016, 0);
    planet.update(0.016, 0.016);
    expect(planet.rotation.y).toBeGreaterThan(initialY);
  });
});

describe('Moon Orbital Mechanics', () => {
  let planet, moon;

  beforeEach(() => {
    vi.clearAllMocks();
    planet = new CELESTIAL.Planet('Earth', 2, 150700000, 188400000, 0.05, 23.5, '#4d9de0', 'earth.jpg');
    moon = new CELESTIAL.Moon(planet, 'TestMoon', 1, 4, 2420000, 0.05, '#e0e0e0', 'moon.jpg');
  });

  it('orbits relative to planet', () => {
    planet.update(0.016, 5);
    moon.update(0.016, 5);
    
    const angle = -moon.orbitSpeed * 5 * 3000;
    const offsetX = moon.orbitRadius * Math.cos(angle);
    const offsetZ = moon.orbitRadius * Math.sin(angle);
    
    expect(moon.position.x).toBeCloseTo(planet.position.x + offsetX);
    expect(moon.position.z).toBeCloseTo(planet.position.z + offsetZ);
  });

  it('moon orbit speed uses same scale as planets', () => {
    expect(moon.orbitSpeed).toBeCloseTo(2420000 / 3000000000000);
  });
});

describe('createOrbitPath with inclination', () => {
  it('creates flat path when inclination is 0', () => {
    const path = CELESTIAL.createOrbitPath(100, '#444466', null, 0);
    expect(path.userData.isOrbitPath).toBe(true);
    expect(path.geometry.type).toBe('TubeGeometry');
  });

  it('creates inclined path when inclination > 0', () => {
    const path = CELESTIAL.createOrbitPath(100, '#444466', null, 7);
    expect(path.userData.isOrbitPath).toBe(true);
    expect(path.geometry.type).toBe('TubeGeometry');
  });
});

describe('CameraManager', () => {
  let renderer, cameraManager;

  beforeEach(() => {
    renderer = {
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      render: vi.fn(),
    };
    cameraManager = new CameraManager(renderer);
  });

  it('initializes with correct camera position', () => {
    expect(cameraManager.camera.position.x).toBe(170);
    expect(cameraManager.camera.position.y).toBe(20);
    expect(cameraManager.camera.position.z).toBe(2);
  });

  it('creates detail camera', () => {
    expect(cameraManager.detailCamera).toBeDefined();
    expect(cameraManager.detailCamera.fov).toBe(50);
  });

  it('opens detail transition', () => {
    const host = { position: { x: 10, y: 0, z: 10 }, size: 5 };
    cameraManager.openDetail(host, false);
    expect(cameraManager.transition).toBeDefined();
    expect(cameraManager.transition.phase).toBe('zoom');
  });

  it('sets moon focus', () => {
    const moonMesh = { position: { x: 5, y: 0, z: 5 }, size: 1, getWorldPosition: vi.fn((v) => v.set(5, 0, 5)) };
    const host = { getWorldPosition: vi.fn((v) => v.set(0, 0, 0)) };
    
    const focus = cameraManager.setMoonFocus(moonMesh, host, false);
    expect(focus).toBeDefined();
    expect(focus.mesh).toBe(moonMesh);
    expect(focus.host).toBe(host);
    expect(cameraManager.controls.enabled).toBe(false);
  });
});

describe('UIController', () => {
  let renderer, cameraManager, uiController;

  beforeEach(() => {
    renderer = {
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      render: vi.fn(),
    };
    cameraManager = new CameraManager(renderer);
    cameraManager.scene = new THREE.Scene();
    
    document.body.innerHTML = `
      <div id="tooltip"></div>
      <div id="detailFade"></div>
      <div id="detailPanel"></div>
      <div id="detailView"></div>
      <div id="detailTitle"></div>
      <div id="detailDescription"></div>
      <div id="detailColorDot"></div>
      <div id="detailDetails"></div>
      <div id="detailFunFact"></div>
      <button id="pauseButton"></button>
      <button id="backButton"></button>
      <div id="loadingScreen"></div>
      <div id="progressBar"></div>
      <span id="progressText"></span>
    `;
    
    uiController = new UIController(cameraManager, simulation.simulation);
  });

  it('initializes with correct state', () => {
    expect(uiController.detailActive).toBe(false);
    expect(uiController.moonFocus).toBeNull();
    expect(uiController.isPaused).toBe(false);
  });

  it('hoverLabelFor returns correct label for planet', () => {
    const planet = { name: 'Earth', color: '#4d9de0' };
    const orbitPath = { userData: { isOrbitPath: true, planet } };
    const label = uiController.hoverLabelFor(orbitPath);
    expect(label.name).toBe('Earth');
    expect(label.color).toBe('#4d9de0');
  });

  it('hoverLabelFor returns correct label for moon orbit path', () => {
    const orbitPath = { userData: { isOrbitPath: true, isMoon: true, moonName: 'Moon' } };
    const label = uiController.hoverLabelFor(orbitPath);
    expect(label.name).toBe('Moon');
  });
});