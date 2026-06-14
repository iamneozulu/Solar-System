import * as THREE from 'three';
import * as CELESTIAL from './celestialObjects.js';
import { PLANET_DATA } from './planetData.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let renderer, scene, camera, controls, raycaster;
let targetPlanet = null;
let simulationTime = 0;
let lastFrameTime = performance.now();
let isPaused = false;

const pointer = new THREE.Vector2();
let mouseDown = false;
let mouseMoved = false;
let mouseDownPos = { x: 0, y: 0 };

const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const pct = Math.round((itemsLoaded / itemsTotal) * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressText').textContent = pct + '%';
};
loadingManager.onLoad = () => {
  const btn = document.getElementById('launchBtn');
  btn.style.display = 'block';
  document.getElementById('progressText').textContent = 'Ready!';
  setTimeout(() => btn.classList.add('visible'), 50);
};

const textureLoader = new THREE.TextureLoader(loadingManager);

const Sun = new CELESTIAL.Star("Sun", 15, 3, PLANET_DATA.Sun.color, "./static/images/sun.jpg", textureLoader);
const Mercury = new CELESTIAL.Planet("Mercury", 1, 69815000, (392000000 / 1.205), 3, 0.027, PLANET_DATA.Mercury.color, "./static/images/mercury.jpg", textureLoader);
const Venus = new CELESTIAL.Planet("Venus", 1.9, 108500000, (684000000 / 3.075), 0.05, 177.36, PLANET_DATA.Venus.color, "./static/images/venus.jpg", textureLoader);
const Earth = new CELESTIAL.Planet("Earth", 2, 150700000, (942000000 / 5), 0.05, 23.5, PLANET_DATA.Earth.color, "./static/images/earth.jpg", textureLoader);
const Lunar = new CELESTIAL.Moon(Earth, "Lunar", 1, 4, (2420000 / 136.61), 0.05, "#e0e0e0", "./static/images/moon.jpg", textureLoader);
const Mars = new CELESTIAL.Planet("Mars", 1.5, 207940000, (1440000000 / 9.4), 0.05, 25, PLANET_DATA.Mars.color, "./static/images/mars.jpg", textureLoader);
const Jupiter = new CELESTIAL.Planet("Jupiter", 7, 749370000 / 2, (4770000000 / 60), 0.05, 3.13, PLANET_DATA.Jupiter.color, "./static/images/jupiter.jpg", textureLoader);
const Saturn = new CELESTIAL.Planet("Saturn", 6.5, 1450400000 / 2, (9120000000 / 147), 0.05, 26.73, PLANET_DATA.Saturn.color, "./static/images/saturn.jpg", textureLoader);
const SaturnRing = new CELESTIAL.PlanetRing(Saturn, 1, 5);
const Uranus = new CELESTIAL.Planet("Uranus", 5, 2930100000 / 3, (18400000000 / 420), 0.05, 97.77, PLANET_DATA.Uranus.color, "./static/images/uranus.jpg", textureLoader);
const UranusRing = new CELESTIAL.PlanetRing(Uranus, 3, 4);
const Neptune = new CELESTIAL.Planet("Neptune", 5, 4472100000 / 3.5, (28100000000 / 825), 0.05, 28, PLANET_DATA.Neptune.color, "./static/images/neptune.jpg", textureLoader);

const MercuryOrbitPath = CELESTIAL.createOrbitPath(Mercury.orbitRadius);
MercuryOrbitPath.userData.planet = Mercury;
const VenusOrbitPath = CELESTIAL.createOrbitPath(Venus.orbitRadius);
VenusOrbitPath.userData.planet = Venus;
const EarthOrbitPath = CELESTIAL.createOrbitPath(Earth.orbitRadius);
EarthOrbitPath.userData.planet = Earth;
const MarsOrbitPath = CELESTIAL.createOrbitPath(Mars.orbitRadius);
MarsOrbitPath.userData.planet = Mars;
const JupiterOrbitPath = CELESTIAL.createOrbitPath(Jupiter.orbitRadius);
JupiterOrbitPath.userData.planet = Jupiter;
const SaturnOrbitPath = CELESTIAL.createOrbitPath(Saturn.orbitRadius);
SaturnOrbitPath.userData.planet = Saturn;
const UranusOrbitPath = CELESTIAL.createOrbitPath(Uranus.orbitRadius);
UranusOrbitPath.userData.planet = Uranus;
const NeptuneOrbitPath = CELESTIAL.createOrbitPath(Neptune.orbitRadius);
NeptuneOrbitPath.userData.planet = Neptune;

const asteroidBelt = new CELESTIAL.AsteroidBelt(1500, 90, 110, 0xb2b2b2, 0.5);
const kuiperBelt = new CELESTIAL.AsteroidBelt(15000, 500, 600, 0xb2b2b2, 0.2);

const planets = [Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune];

init();
animate();

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  loadingManager.itemStart('hdri');
  const HDRIloader = new EXRLoader(loadingManager);
  HDRIloader.load('./static/images/NightSkyHDRI001_2K_HDR.exr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
  });

  scene.add(Sun);
  scene.add(Mercury);
  scene.add(MercuryOrbitPath);
  scene.add(Venus);
  scene.add(VenusOrbitPath);
  scene.add(Earth);
  scene.add(EarthOrbitPath);
  scene.add(Lunar);
  scene.add(Mars);
  scene.add(MarsOrbitPath);
  scene.add(Jupiter);
  scene.add(JupiterOrbitPath);
  scene.add(Saturn);
  scene.add(SaturnOrbitPath);
  scene.add(SaturnRing);
  scene.add(Uranus);
  scene.add(UranusOrbitPath);
  scene.add(UranusRing);
  scene.add(Neptune);
  scene.add(NeptuneOrbitPath);
  scene.add(asteroidBelt);
  scene.add(kuiperBelt);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.set(170, 20, 2);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY };
  controls.minDistance = 50;
  controls.maxDistance = 1000;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
  controls.panSpeed = 1;

  raycaster = new THREE.Raycaster();

  window.addEventListener('resize', onWindowResize);
  document.addEventListener('pointerdown', (event) => {
    mouseDown = true;
    mouseMoved = false;
    mouseDownPos = { x: event.clientX, y: event.clientY };
  });
  document.addEventListener('pointermove', (event) => {
    if (mouseDown) {
      const dx = event.clientX - mouseDownPos.x;
      const dy = event.clientY - mouseDownPos.y;
      if (dx * dx + dy * dy > 25) mouseMoved = true;
    }
  });
  document.addEventListener('pointerup', (event) => {
    mouseDown = false;
    if (!mouseMoved) onClick(event);
  });
  document.getElementById('pauseButton').onclick = () => {
    isPaused = !isPaused;
    document.getElementById('pauseButton').textContent = isPaused ? '▶' : '⏸';
  };
  document.getElementById('launchBtn').onclick = () => {
    document.getElementById('loadingScreen').style.display = 'none';
  };
}

function onClick(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    if (obj.userData.isOrbitPath && obj.userData.planet) {
      targetPlanet = obj.userData.planet;
      controls.minDistance = 0;
      showPlanetInfo(targetPlanet);
      return;
    }
    if (obj.position) {
      targetPlanet = obj;
      controls.minDistance = obj === Sun ? 50 : 0;
      showPlanetInfo(obj);
    }
  } else {
    targetPlanet = null;
    controls.minDistance = 50;
    closeSidebar();
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function showPlanetInfo(object) {
  const name = object.name;
  const data = PLANET_DATA[name];
  if (!data) return;

  document.getElementById('sidebarTitle').textContent = name;
  document.getElementById('sidebarDescription').textContent = data.description;
  document.getElementById('planetColorDot').style.background = data.color;
  document.getElementById('infoSidebar').style.borderColor = data.color;
  document.getElementById('sidebarTitle').style.color = data.color;

  const detailsEl = document.getElementById('sidebarDetails');
  detailsEl.innerHTML = '';
  for (const [label, value] of Object.entries(data.details)) {
    const row = document.createElement('div');
    row.className = 'detail-row';
    row.innerHTML = `<span class="detail-label">${label}</span><span class="detail-value">${value}</span>`;
    detailsEl.appendChild(row);
  }

  document.getElementById('sidebarFunFact').textContent = '💡 ' + data.funFact;
  document.getElementById('infoSidebar').classList.add('open');
}

function closeSidebar() {
  document.getElementById('infoSidebar').classList.remove('open');
}

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;

  if (!isPaused) {
    simulationTime += deltaTime;
    Sun.update(deltaTime);
    for (const p of planets) p.update(deltaTime, simulationTime);
    Lunar.update(deltaTime, simulationTime);
    SaturnRing.update();
    UranusRing.update();
    asteroidBelt.update(deltaTime);
    kuiperBelt.update(deltaTime);

    if (targetPlanet && targetPlanet !== Sun) {
      if (targetPlanet.isMoon()) {
        CELESTIAL.cameraOrbit(camera, targetPlanet.planet, simulationTime);
      } else {
        CELESTIAL.cameraOrbit(camera, targetPlanet, simulationTime);
      }
      camera.lookAt(scene.position);
    }
  }

  controls.update();
  renderer.render(scene, camera);
}
