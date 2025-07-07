import * as THREE from './node_modules/three';
import * as CELESTIAL from './celestialObjects.js';
import { RGBELoader } from './node_modules/three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import Stats from './node_modules/three/examples/jsm/libs/stats.module.js';

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
const Sun = new CELESTIAL.Star("Sun", 15, 3, "./static/images/sun.jpg");
const Mercury = new CELESTIAL.Planet("Mercury", 1, 69815000, (392000000 / 1.205), 3, 0.027, "./static/images/mercury.jpg");
const Venus = new CELESTIAL.Planet("Venus", 1.9, 108500000, (684000000 / 3.075), 0.05, 177.36, "./static/images/venus.jpg");
const Earth = new CELESTIAL.Planet("Earth", 2, 150700000, (942000000 / 5), 0.05, 23.5, "./static/images/earth.jpg");
const Lunar = new CELESTIAL.Moon(Earth, "Lunar", 1, 4, (2420000 / 136.61), 0.05, "./static/images/moon.jpg");
const Mars = new CELESTIAL.Planet("Mars", 1.5, 207940000, (1440000000 / 9.4), 0.05, 25, "./static/images/mars.jpg");
const Jupiter = new CELESTIAL.Planet("Jupiter", 7, 749370000/2, (4770000000 / 60), 0.05, 3.13, "./static/images/jupiter.jpg");
const Saturn = new CELESTIAL.Planet("Saturn", 6.5, 1450400000/2, (9120000000 / 147), 0.05, 26.73, "./static/images/saturn.jpg");
const SaturnRing = new CELESTIAL.PlanetRing(Saturn, 1, 5);
const Uranus = new CELESTIAL.Planet("Uranus", 5, 2930100000/3, (18400000000 / 420), 0.05, 97.77, "./static/images/uranus.jpg");
const UranusRing = new CELESTIAL.PlanetRing(Uranus, 3, 4);
const Neptune = new CELESTIAL.Planet("Neptune", 5, 4472100000/3.5, (28100000000 / 825), 0.05, 28, "./static/images/neptune.jpg");

init();
updateFPS()
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
    HDRIloader.setPath('./static/images/');
    HDRIloader.load('./static/images/HDR_hazy_nebulae.hdr', function (texture) {
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
    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(100, 0, 2);

    // Orbit Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY };
    controls.minDistance = 50;
    controls.maxDistance = 600;
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
                controls.minDistance = 50;
            } else {
                targetPlanet = intersectedObject;
                controls.minDistance = 0;
            }

            // Update modal content and open it
            modalContent(intersectedObject)
            
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

// Creates and formats content for modal
async function modalContent( object ) {

    const planetName = object.objectName(); // Get the planet name
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(planetName)}`;


    try {
        // Fetch the Wikipedia summary
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Check if the data contains an extract
        const modalContent = data.extract ? data.extract : "No summary available.";

        // Set the modal content
        document.getElementById('modalText').textContent = modalContent;
        document.querySelector('.modal-content h2').textContent = planetName;

        // Open the modal
        openModal();
    } catch (error) {
        console.error('Error fetching Wikipedia content:', error);
        document.getElementById('modalText').textContent = "Error loading content.";
        document.querySelector('.modal-content h2').textContent = planetName;

        // Open the modal even if there's an error
        openModal();
    }

}

// Opens the modal dialog
function openModal() {
    document.getElementById('planetInfo').style.display = 'flex';
}

// Closes the modal dialog
function closeModal() {
    document.getElementById('planetInfo').style.display = 'none';
}

// Main animation loop
function animate() {
    requestAnimationFrame(animate);
    render();
    stats.update();
}

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

    if (targetPlanet) {
        try {
            CELESTIAL.cameraOrbit(camera, targetPlanet.hostPlanet());
            camera.lookAt(scene.position);
        } catch {
            CELESTIAL.cameraOrbit(camera, targetPlanet);
            camera.lookAt(scene.position);
        }
    } else {
        closeModal();
    }

    controls.update();
    renderer.render(scene, camera);
}