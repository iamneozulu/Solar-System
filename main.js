import * as THREE from 'three';
import * as CELESTIAL from './celestialObjects';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

let stats;
let renderer, scene, camera, controls, raycaster;

let INTERSECTED;
let targetPlanet = null;

const pointer = new THREE.Vector2();

let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;
const fpsThreshold = 30; // Minimum FPS threshold for hiding the loading screen
const loadingScreen = document.getElementById('loading-screen');

// Initialize celestial objects
const Sun = new CELESTIAL.Star(15, 3, "public_assets/textures/sun.jpg");
const Mercury = new CELESTIAL.Planet(1, 69815000, (392000000 / 1.205), 3, 0.027, "public_assets/textures/mercury.jpg");
const Venus = new CELESTIAL.Planet(1.9, 108500000, (684000000 / 3.075), 0.05, 177.36, "public_assets/textures/venus.jpg");
const Earth = new CELESTIAL.Planet(2, 150700000, (942000000 / 5), 0.05, 23.5, "public_assets/textures/earth.jpg");
const Lunar = new CELESTIAL.Moon(1, 4, (2420000 / 136.61), 0.05, "public_assets/textures/moon.jpg");
const Mars = new CELESTIAL.Planet(1.5, 207940000, (1440000000 / 9.4), 0.05, 25, "public_assets/textures/mars.jpg");
const Jupiter = new CELESTIAL.Planet(7, 749370000, (4770000000 / 60), 0.05, 3.13, "public_assets/textures/jupiter.jpg");
const Saturn = new CELESTIAL.Planet(6.5, 1450400000, (9120000000 / 147), 0.05, 26.73, "public_assets/textures/saturn.jpg");
const SaturnRing = new CELESTIAL.PlanetRing(Saturn, 1, 5);
const Uranus = new CELESTIAL.Planet(5, 2930100000, (18400000000 / 420), 0.05, 97.77, "public_assets/textures/uranus.jpg");
const UranusRing = new CELESTIAL.PlanetRing(Uranus, 3, 4);
const Neptune = new CELESTIAL.Planet(5, 4472100000, (28100000000 / 825), 0.05, 28, "public_assets/textures/neptune.jpg");

init();
animate();

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
    const HDRIloader = new RGBELoader();
    HDRIloader.load('public_assets/textures/HDR_hazy_nebulae.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
    });

    // Add objects to the scene
    scene.add(Sun);
    scene.add(Mercury);
    scene.add(Venus);
    scene.add(Earth);
    scene.add(Lunar);
    scene.add(Mars);
    scene.add(Jupiter);
    scene.add(Saturn);
    scene.add(SaturnRing);
    scene.add(Uranus);
    scene.add(UranusRing);
    scene.add(Neptune);

    // Camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50000);
    camera.position.set(700, 700, 700);

    // Orbit Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY };
    controls.minDistance = 100;
    controls.maxDistance = 5000;
    controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
    controls.panSpeed = 1;

    // Raycaster
    raycaster = new THREE.Raycaster();

    // Stats
    stats = new Stats();
    document.body.appendChild(stats.dom);

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('click', onClick);
}

// Handles object click events
function onClick(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;

        if (intersectedObject.position) {
            if (intersectedObject === Sun) {
                controls.minDistance = 100;
            } else {
                targetPlanet = intersectedObject;
                controls.minDistance = 0;
            }

            // Update modal content and open it
            document.getElementById('modalText').textContent = `You clicked on ${intersectedObject.name || 'an object'}`;
            openModal();
        }
    } else {
        if (INTERSECTED && INTERSECTED.position) {
            INTERSECTED = null;
        }
        targetPlanet = INTERSECTED;
        controls.minDistance = 100;
        closeModal()
    }
}

// Handles window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Updates FPS and manages the loading screen
function updateFPS() {
    const now = performance.now();
    const deltaTime = now - lastFrameTime;
    frameCount++;

    if (deltaTime >= 1000) { // Update every second
        fps = frameCount / (deltaTime / 1000);
        frameCount = 0;
        lastFrameTime = now;

        if (fps >= fpsThreshold && loadingScreen) {
            loadingScreen.style.display = "none";
        }
    }

    requestAnimationFrame(updateFPS);
}

// Opens the modal dialog
function openModal() {
    document.getElementById('myModal').style.display = 'flex';
}

// Closes the modal dialog
function closeModal() {
    document.getElementById('myModal').style.display = 'none';
}

// Main animation loop
function animate() {
    requestAnimationFrame(animate);
    render();
    stats.update();
    updateFPS();
}

// Renders the scene and updates objects
function render() {
    // Orbit and rotation calculations
    Sun.starRotation();
    Mercury.planetOrbit();
    Venus.planetOrbit();
    Earth.planetOrbit();
    Lunar.moonOrbit(Earth);
    Mars.planetOrbit();
    Jupiter.planetOrbit();
    Saturn.planetOrbit();
    SaturnRing.planetRingOrbit(Saturn);
    Uranus.planetOrbit();
    UranusRing.planetRingOrbit(Uranus);
    Neptune.planetOrbit();

    if (targetPlanet) {
        CELESTIAL.cameraOrbit(camera, targetPlanet);
        camera.lookAt(scene.position);
    }

    controls.update();
    renderer.render(scene, camera);
}