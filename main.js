import * as THREE from './node_modules/three';
import * as CELESTIAL from './celestialObjects.js';
import { RGBELoader } from './node_modules/three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
// import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';

// let stats;
let renderer, scene, camera, controls, raycaster;

let INTERSECTED;
let targetPlanet = null;

const pointer = new THREE.Vector2();

let lastFrameTime = performance.now(); 
let frameCount = 0;
let fps = 0;

const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = function () {
    const btn = document.getElementById('launchBtn');
    btn.style.display = 'block';
    setTimeout(() => btn.classList.add('visible'), 10);
};

const textureLoader = new THREE.TextureLoader(loadingManager);

//--------------------------------------------------------------------------------------------------------------------------------------------

const Sun = new CELESTIAL.Star("Sun", 15, 3, "./static/images/sun.jpg", textureLoader);
// Mercury
const Mercury = new CELESTIAL.Planet("Mercury", 1, 69815000, (392000000 / 1.205), 3, 0.027, "./static/images/mercury.jpg", textureLoader);
const MercuryOrbitPath = new CELESTIAL.createOrbitPath(Mercury.orbitRadius)
MercuryOrbitPath.userData.planet = Mercury;
// Venus
const Venus = new CELESTIAL.Planet("Venus", 1.9, 108500000, (684000000 / 3.075), 0.05, 177.36, "./static/images/venus.jpg", textureLoader);
const VenusOrbitPath = new CELESTIAL.createOrbitPath(Venus.orbitRadius)
VenusOrbitPath.userData.planet = Venus;
// Earth
const Earth = new CELESTIAL.Planet("Earth", 2, 150700000, (942000000 / 5), 0.05, 23.5, "./static/images/earth.jpg", textureLoader);
const EarthOrbitPath = new CELESTIAL.createOrbitPath(Earth.orbitRadius);
EarthOrbitPath.userData.planet = Earth;
const Lunar = new CELESTIAL.Moon(Earth, "Lunar", 1, 4, (2420000 / 136.61), 0.05, "./static/images/moon.jpg", textureLoader);
// Mars
const Mars = new CELESTIAL.Planet("Mars", 1.5, 207940000, (1440000000 / 9.4), 0.05, 25, "./static/images/mars.jpg", textureLoader);
const MarsOrbitPath = new CELESTIAL.createOrbitPath(Mars.orbitRadius);
MarsOrbitPath.userData.planet = Mars;
// Jupiter
const Jupiter = new CELESTIAL.Planet("Jupiter", 7, 749370000/2, (4770000000 / 60), 0.05, 3.13, "./static/images/jupiter.jpg", textureLoader);
const JupiterOrbitPath = new CELESTIAL.createOrbitPath(Jupiter.orbitRadius);
JupiterOrbitPath.userData.planet = Jupiter;
// Saturn
const Saturn = new CELESTIAL.Planet("Saturn", 6.5, 1450400000/2, (9120000000 / 147), 0.05, 26.73, "./static/images/saturn.jpg", textureLoader);
const SaturnOrbitPath = new CELESTIAL.createOrbitPath(Saturn.orbitRadius);
SaturnOrbitPath.userData.planet = Saturn;
const SaturnRing = new CELESTIAL.PlanetRing(Saturn, 1, 5);
// Uranus
const Uranus = new CELESTIAL.Planet("Uranus", 5, 2930100000/3, (18400000000 / 420), 0.05, 97.77, "./static/images/uranus.jpg", textureLoader);
const UranusOrbitPath = new CELESTIAL.createOrbitPath(Uranus.orbitRadius);
UranusOrbitPath.userData.planet = Uranus;
const UranusRing = new CELESTIAL.PlanetRing(Uranus, 3, 4);
// Neptune
const Neptune = new CELESTIAL.Planet("Neptune", 5, 4472100000/3.5, (28100000000 / 825), 0.05, 28, "./static/images/neptune.jpg", textureLoader);
const NeptuneOrbitPath = new CELESTIAL.createOrbitPath(Neptune.orbitRadius);
NeptuneOrbitPath.userData.planet = Neptune;
// Astroid Belts
const asteroidBelt = new CELESTIAL.AsteroidBelt(1500, 90, 110, 0xb2b2b2, 0.5);
const kuiperBelt = new CELESTIAL.AsteroidBelt(15000, 500, 600, 0xb2b2b2, 0.2);

//--------------------------------------------------------------------------------------------------------------------------------------------

init();
updateFPS()
animate();

//--------------------------------------------------------------------------------------------------------------------------------------------

// Initializes essential features
function init() {
    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Scene
    scene = new THREE.Scene();

    // Space HDRI
    loadingManager.itemStart('hdri');

    const HDRIloader = new RGBELoader();
    HDRIloader.load('./static/images/HDR_hazy_nebulae.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
        loadingManager.itemEnd('hdri');
    });

    //------------------------------------------------------------------

    // Add objects to the scene
    scene.add(Sun);
    //Mercury
    scene.add(Mercury);
    scene.add(MercuryOrbitPath);
    // Venus
    scene.add(Venus);
    scene.add(VenusOrbitPath);
    // Earth
    scene.add(Earth);
    scene.add(EarthOrbitPath);
    scene.add(Lunar);
    // Mars
    scene.add(Mars);
    scene.add(MarsOrbitPath);
    // Jupiter
    scene.add(Jupiter);
    scene.add(JupiterOrbitPath);
    // Saturn
    scene.add(Saturn);
    scene.add(SaturnOrbitPath);
    scene.add(SaturnRing);
    // Uranus
    scene.add(Uranus);
    scene.add(UranusOrbitPath);
    scene.add(UranusRing);
    // Neptune
    scene.add(Neptune);
    scene.add(NeptuneOrbitPath);
    // Asteroid belt
    scene.add(asteroidBelt);
    scene.add(kuiperBelt);

    //-----------------------------------------------------------------

    // Camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(170, 20, 2);

    //-----------------------------------------------------------------

    // Orbit Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY };
    controls.minDistance = 50;
    controls.maxDistance = 1000;
    controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
    controls.panSpeed = 1;

    //-----------------------------------------------------------------

    // Raycaster
    raycaster = new THREE.Raycaster();

    //-----------------------------------------------------------------

    // // Stats
    // stats = new Stats();
    // document.body.appendChild(stats.dom);

    //-----------------------------------------------------------------

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('click', onClick);
    document.getElementById('launchBtn').onclick = function() {
        document.getElementById('loadingScreen').style.display = 'none';
    };
}

//--------------------------------------------------------------------------------------------------------------------------------------------

// Handles object click events
function onClick(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;

        // If orbit path is clicked, select its planet
        if (intersectedObject.userData.isOrbitPath && intersectedObject.userData.planet) {
            targetPlanet = intersectedObject.userData.planet;
            controls.minDistance = 0;
            modalContent(targetPlanet);
            return;
        }

        if (intersectedObject.position) {
            if (intersectedObject === Sun) {
                controls.minDistance = 50;
            } else {
                targetPlanet = intersectedObject;
                controls.minDistance = 0;
            }
            modalContent(intersectedObject);
        }
    } else {
        if (INTERSECTED && INTERSECTED.position) {
            INTERSECTED = null;
        }
        targetPlanet = INTERSECTED;
        controls.minDistance = 50;
        closeModal();
    }
}

//--------------------------------------------------------------------------------------------------------------------------------------------

// Handles window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

//--------------------------------------------------------------------------------------------------------------------------------------------

// Updates FPS and manages the loading screen
function updateFPS() {
    const now = performance.now();
    const deltaTime = now - lastFrameTime;
    frameCount++;

    if (deltaTime >= 1000) { // Update every second
        fps = frameCount / (deltaTime / 1000);
        frameCount = 0;
        lastFrameTime = now;
    }

    requestAnimationFrame(updateFPS);
}

//--------------------------------------------------------------------------------------------------------------------------------------------

// Creates and formats content for modal
async function modalContent(object) {
    const planetName = object.objectName();
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(planetName)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const sidebarContent = data.extract ? data.extract : "No summary available.";
        openSidebar(planetName, sidebarContent);
    } catch (error) {
        console.error('Error fetching Wikipedia content:', error);
        openSidebar(planetName, "Error loading content.");
    }
}

function openSidebar(title, content) {
    document.getElementById('sidebarTitle').textContent = title;
    document.getElementById('sidebarText').textContent = content;
    document.getElementById('infoSidebar').classList.add('open');
}

function closeSidebar() {
    document.getElementById('infoSidebar').classList.remove('open');
}

//--------------------------------------------------------------------------------------------------------------------------------------------

// Main animation loop
function animate() {
    requestAnimationFrame(animate);
    render();
    // stats.update();
}

//--------------------------------------------------------------------------------------------------------------------------------------------

// Renders the scene and updates objects
function render() {
    // Orbit and rotation calculations
    Sun.starRotation();
    Mercury.planetOrbit();
    Venus.planetOrbit();
    Earth.planetOrbit();
    Lunar.moonOrbit();
    Mars.planetOrbit();
    Jupiter.planetOrbit();
    Saturn.planetOrbit();
    SaturnRing.planetRingOrbit();
    Uranus.planetOrbit();
    UranusRing.planetRingOrbit();
    Neptune.planetOrbit();
    asteroidBelt.rotateBelt()
    kuiperBelt.rotateBelt();

    if (targetPlanet) {
        try {
            CELESTIAL.cameraOrbit(camera, targetPlanet.hostPlanet());
            camera.lookAt(scene.position);
        } catch {
            CELESTIAL.cameraOrbit(camera, targetPlanet);
            camera.lookAt(scene.position);
        }
    } else {
        closeSidebar();
    }

    controls.update();
    renderer.render(scene, camera);
}