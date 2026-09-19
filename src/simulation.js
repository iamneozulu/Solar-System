import * as THREE from 'three';
import * as CELESTIAL from './celestialObjects.js';
import { PLANET_DATA } from './planetData.js';
import { MOON_INFO } from './moonData.js';
import { createStarfield } from './starfield.js';

const Sun = new CELESTIAL.Star("Sun", 15, 0.15, PLANET_DATA.Sun.color, "./static/images/sun.jpg");
const Mercury = new CELESTIAL.Planet("Mercury", 1, 69815000, (392000000 / 1.205), 3, 0.027, PLANET_DATA.Mercury.color, "./static/images/mercury.jpg");
const Venus = new CELESTIAL.Planet("Venus", 1.9, 108500000, (684000000 / 3.075), 0.05, 177.36, PLANET_DATA.Venus.color, "./static/images/venus.jpg");
const Earth = new CELESTIAL.Planet("Earth", 2, 150700000, (942000000 / 5), 0.05, 23.5, PLANET_DATA.Earth.color, "./static/images/earth.jpg");
const Lunar = new CELESTIAL.Moon(Earth, "Lunar", 1, 4, 2420000 * 50, 0.05, "#e0e0e0", "./static/images/moon.jpg");
const Mars = new CELESTIAL.Planet("Mars", 1.5, 207940000, (1440000000 / 9.4), 0.05, 25, PLANET_DATA.Mars.color, "./static/images/mars.jpg");
const Jupiter = new CELESTIAL.Planet("Jupiter", 7, 749370000 / 2, (4770000000 / 60), 0.05, 3.13, PLANET_DATA.Jupiter.color, "./static/images/jupiter.jpg");
const Saturn = new CELESTIAL.Planet("Saturn", 6.5, 1450400000 / 2, (9120000000 / 147), 0.05, 26.73, PLANET_DATA.Saturn.color, "./static/images/saturn.jpg");
const SaturnRingTexture = CELESTIAL.generateRingTexture();
const SaturnRing = new CELESTIAL.PlanetRing(Saturn, 1, 5, SaturnRingTexture);
const Uranus = new CELESTIAL.Planet("Uranus", 5, 2930100000 / 3, (18400000000 / 420), 0.05, 97.77, PLANET_DATA.Uranus.color, "./static/images/uranus.jpg");
const UranusRing = new CELESTIAL.PlanetRing(Uranus, 3, 4);
const Neptune = new CELESTIAL.Planet("Neptune", 5, 4472100000 / 3.5, (28100000000 / 825), 0.05, 28, PLANET_DATA.Neptune.color, "./static/images/neptune.jpg");

const planets = [Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune];

for (const planet of planets) {
  planet.orbitInclination = PLANET_DATA[planet.name].inclination ?? 0;
}

const orbitPaths = planets.map(planet => {
  const path = CELESTIAL.createOrbitPath(planet.orbitRadius, PLANET_DATA[planet.name].color, null, planet.orbitInclination);
  path.userData.planet = planet;
  return path;
});

const asteroidBelt = new CELESTIAL.AsteroidBelt(1500, 90, 110, 0xb2b2b2, 0.5);
const kuiperBelt = new CELESTIAL.AsteroidBelt(15000, 500, 600, 0xb2b2b2, 0.2);

export const simulation = {
  Sun,
  planets,
  Lunar,
  SaturnRing,
  UranusRing,
  asteroidBelt,
  kuiperBelt,
  orbitPaths,
  simulationTime: 0,

  update(deltaTime) {
    this.simulationTime += deltaTime;
    this.Sun.update(deltaTime);
    for (const p of this.planets) p.update(deltaTime, this.simulationTime);
    this.Lunar.update(deltaTime, this.simulationTime);
    this.SaturnRing.update();
    this.UranusRing.update();
    this.asteroidBelt.update(deltaTime);
    this.kuiperBelt.update(deltaTime);
  },

  getAllObjects() {
    return [
      this.Sun,
      ...this.planets,
      this.Lunar,
      this.SaturnRing,
      this.UranusRing,
      this.asteroidBelt,
      this.kuiperBelt,
      ...this.orbitPaths,
    ];
  },

  getObjectByName(name) {
    if (name === 'Sun') return this.Sun;
    if (name === 'Lunar') return this.Lunar;
    return this.planets.find(p => p.name === name);
  },
};