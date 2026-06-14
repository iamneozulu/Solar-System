import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  THREE.DoubleSide = Symbol('DoubleSide');
  THREE.LinearMipmapLinearFilter = Symbol('LinearMipmapLinearFilter');
  THREE.MathUtils = { degToRad: (d) => d * Math.PI / 180 };
  THREE.TextureLoader = function() { return mockLoader; };

  return { default: THREE, LineLoop: MockLineLoop, ...THREE };
});

const THREE = await import('three');
const CELESTIAL = await import('../src/celestialObjects.js');

describe('Star', () => {
  let star;

  beforeEach(() => {
    vi.clearAllMocks();
    star = new CELESTIAL.Star('Sun', 15, 3, '#ffd600', 'sun.jpg', mockLoader);
  });

  it('constructs with correct properties', () => {
    expect(star.name).toBe('Sun');
    expect(star.size).toBe(15);
    expect(star.rotationSpeed).toBe(3);
    expect(star.color).toBe('#ffd600');
    expect(star.texture).toBe('sun.jpg');
  });

  it('is a THREE.Mesh', () => {
    expect(star).toBeInstanceOf(THREE.Mesh);
  });

  it('update adds rotation based on deltaTime', () => {
    const initialY = star.rotation.y;
    star.update(0.016);
    expect(star.rotation.y).toBe(initialY + 3 * 0.016);
  });

  it('update with zero delta does not rotate', () => {
    const initialY = star.rotation.y;
    star.update(0);
    expect(star.rotation.y).toBe(initialY);
  });

  it('starts with rotation.y offset of 1', () => {
    expect(star.rotation.y).toBe(1);
  });
});

describe('Planet', () => {
  let planet;

  beforeEach(() => {
    vi.clearAllMocks();
    planet = new CELESTIAL.Planet('Earth', 2, 150700000, 188400000, 0.05, 23.5, '#4d9de0', 'earth.jpg', mockLoader);
  });

  it('constructs with correct properties', () => {
    expect(planet.name).toBe('Earth');
    expect(planet.size).toBe(2);
    expect(planet.rotationSpeed).toBe(0.05);
    expect(planet.axisTilt).toBe(23.5);
    expect(planet.color).toBe('#4d9de0');
    expect(planet.texture).toBe('earth.jpg');
  });

  it('computes orbitRadius correctly', () => {
    expect(planet.orbitRadius).toBe(150700000 / 3000000);
  });

  it('computes orbitSpeed correctly', () => {
    expect(planet.orbitSpeed).toBe(188400000 / 600000000000);
  });

  it('is a THREE.Mesh', () => {
    expect(planet).toBeInstanceOf(THREE.Mesh);
  });

  it('isMoon returns false', () => {
    expect(planet.isMoon()).toBe(false);
  });

  it('update sets position from orbit and simTime', () => {
    planet.update(0.016, 10);
    const expectedX = planet.orbitRadius * Math.cos(-planet.orbitSpeed * 10 * 1000);
    const expectedZ = planet.orbitRadius * Math.sin(-planet.orbitSpeed * 10 * 1000);
    expect(planet.position.x).toBeCloseTo(expectedX);
    expect(planet.position.z).toBeCloseTo(expectedZ);
  });

  it('update adds rotation over deltaTime', () => {
    const initialY = planet.rotation.y;
    planet.update(0.016, 0);
    expect(planet.rotation.y).toBe(initialY + 0.05 * 0.016);
  });
});

describe('Moon', () => {
  let planet, moon;

  beforeEach(() => {
    vi.clearAllMocks();
    planet = new CELESTIAL.Planet('Earth', 2, 150700000, 188400000, 0.05, 23.5, '#4d9de0', 'earth.jpg', mockLoader);
    moon = new CELESTIAL.Moon(planet, 'Lunar', 1, 4, 17700, 0.05, '#e0e0e0', 'moon.jpg', mockLoader);
  });

  it('constructs with correct properties', () => {
    expect(moon.name).toBe('Lunar');
    expect(moon.size).toBe(1);
    expect(moon.orbitRadius).toBe(4);
    expect(moon.color).toBe('#e0e0e0');
    expect(moon.texture).toBe('moon.jpg');
  });

  it('references host planet', () => {
    expect(moon.planet).toBe(planet);
  });

  it('isMoon returns true', () => {
    expect(moon.isMoon()).toBe(true);
  });

  it('update positions relative to planet', () => {
    planet.update(0.016, 5);
    moon.update(0.016, 5);
    const offsetX = moon.orbitRadius * Math.cos(-moon.orbitSpeed * 5 * 1000);
    const offsetZ = moon.orbitRadius * Math.sin(-moon.orbitSpeed * 5 * 1000);
    expect(moon.position.x).toBe(planet.position.x + offsetX);
    expect(moon.position.z).toBe(planet.position.z + offsetZ);
  });
});

describe('PlanetRing', () => {
  let planet, ring;

  beforeEach(() => {
    vi.clearAllMocks();
    planet = new CELESTIAL.Planet('Saturn', 6.5, 1450400000 / 2, 62040816, 0.05, 26.73, '#e8d5a3', 'saturn.jpg', mockLoader);
    ring = new CELESTIAL.PlanetRing(planet, 1, 5);
  });

  it('references host planet', () => {
    expect(ring.planet).toBe(planet);
  });

  it('update follows planet position', () => {
    planet.update(0.016, 10);
    ring.update();
    expect(ring.position.x).toBe(planet.position.x);
    expect(ring.position.z).toBe(planet.position.z);
  });
});

describe('AsteroidBelt', () => {
  let belt;

  beforeEach(() => {
    vi.clearAllMocks();
    belt = new CELESTIAL.AsteroidBelt(100, 50, 70, 0xb2b2b2, 0.5);
  });

  it('constructs with correct name', () => {
    expect(belt.name).toBe('AsteroidBelt');
  });

  it('is a THREE.Points', () => {
    expect(belt).toBeInstanceOf(THREE.Points);
  });

  it('update rotates the belt', () => {
    const initialY = belt.rotation.y;
    belt.update(0.016);
    expect(belt.rotation.y).toBe(initialY + 0.001 * 0.016 * 60);
  });

  it('raycast is a no-op', () => {
    expect(() => belt.raycast()).not.toThrow();
  });
});

describe('cameraOrbit', () => {
  it('positions camera around a planet', () => {
    const planet = new CELESTIAL.Planet('Mars', 1.5, 207940000, 153191489, 0.05, 25, '#e07050', 'mars.jpg', mockLoader);
    const camera = { position: { x: 0, y: 0, z: 0 } };
    CELESTIAL.cameraOrbit(camera, planet, 15);
    const expectedX = (planet.orbitRadius + 15) * Math.cos(-planet.orbitSpeed * 15 * 1000);
    const expectedZ = (planet.orbitRadius + 15) * Math.sin(-planet.orbitSpeed * 15 * 1000);
    expect(camera.position.x).toBeCloseTo(expectedX);
    expect(camera.position.z).toBeCloseTo(expectedZ);
  });
});

describe('createOrbitPath', () => {
  it('returns a line loop with orbitPath userData', () => {
    const path = CELESTIAL.createOrbitPath(100, 0x444466);
    expect(path.type).toBe('LineLoop');
    expect(path.userData.isOrbitPath).toBe(true);
    expect(path.rotation.x).toBe(Math.PI / 2);
  });
});

describe('planetData integration', () => {
  it('PLANET_DATA covers all objects', async () => {
    const PD = await import('../src/planetData.js');
    const names = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
    for (const name of names) {
      expect(PD.PLANET_DATA[name]).toBeDefined();
      expect(PD.PLANET_DATA[name].color).toBeDefined();
      expect(PD.PLANET_DATA[name].description).toBeDefined();
      expect(PD.PLANET_DATA[name].details).toBeDefined();
      expect(PD.PLANET_DATA[name].funFact).toBeDefined();
    }
  });
});
