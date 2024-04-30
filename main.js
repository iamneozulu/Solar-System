import * as THREE from 'three';
import * as CELESTIAL from './celestialObjects';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

let stats;
let renderer, scene, camera, controls, raycaster;

let INTERSECTED;

const pointer = new THREE.Vector2();

//Initializing planets
const Sun = new CELESTIAL.Star(10, 3, "public_assets/textures/sun.jpg" );

const Mercury = new CELESTIAL.Planet(1, 1, (392000000/1.205), 3, 0.027, "public_assets/textures/mercury.jpg");
const MercuryOrbit = new CELESTIAL.OrbitRing(Mercury);

const Venus = new CELESTIAL.Planet(1.9, 2, (684000000/3.075), 0.05, 177.36, "public_assets/textures/venus.jpg");
const VenusOrbit = new CELESTIAL.OrbitRing(Venus);

const Earth = new CELESTIAL.Planet(2, 3, (942000000/5), 0.05, -23.5,"public_assets/textures/earth.jpg");
const Lunar = new CELESTIAL.Moon(1, 4, (2420000/136.61), 0.05, "public_assets/textures/moon.jpg");
const EarthOrbit = new CELESTIAL.OrbitRing(Earth);

const Mars = new CELESTIAL.Planet(1.5, 4, (1440000000/9.4), 0.05, 25, "public_assets/textures/mars.jpg");
const MarsOrbit = new CELESTIAL.OrbitRing(Mars);

const Jupiter = new CELESTIAL.Planet(5, 8, (4770000000/60), 3, 3.13, "public_assets/textures/jupiter.jpg");
const JupiterOrbit = new CELESTIAL.OrbitRing(Jupiter);

const Saturn = new CELESTIAL.Planet(4.5, 10, (9120000000/147), 3, 26.73, "public_assets/textures/saturn.jpg");
const SaturnRing = new CELESTIAL.PlanetRing(Saturn, 1, 5);
const SaturnOrbit = new CELESTIAL.OrbitRing(Saturn);

const Uranus = new CELESTIAL.Planet(4, 12, (18400000000/420), 3, 97.77, "public_assets/textures/uranus.jpg");
const UranusRing = new CELESTIAL.PlanetRing(Uranus, 3, 4)
const UranusOrbit = new CELESTIAL.OrbitRing(Uranus);

const Neptune = new CELESTIAL.Planet(4, 15, (28100000000/825), 3, 28,"public_assets/textures/neptune.jpg");
const NeptuneOrbit = new CELESTIAL.OrbitRing(Neptune);


init()
animate()

//Initializes all important features like camera, renderer, controls etc
function init() {
    
    //renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    
    
    // scene
    scene = new THREE.Scene();
    
    //space HDRI
    const HDRIloader = new RGBELoader();
    HDRIloader.load('public_assets/textures/HDR_hazy_nebulae.hdr', function(texture){
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
    });
    
    scene.add(Sun);
    
    scene.add(Mercury);
    scene.add(MercuryOrbit);
    
    scene.add(Venus);
    scene.add(VenusOrbit);
    
    scene.add(Earth);
    scene.add(Lunar);
    scene.add( EarthOrbit );
    
    scene.add(Mars);
    scene.add(MarsOrbit);
    
    scene.add(Jupiter);
    scene.add(JupiterOrbit);
    
    scene.add(Saturn);
    scene.add(SaturnRing);
    scene.add(SaturnOrbit);
    
    scene.add(Uranus);
    scene.add(UranusRing);
    scene.add(UranusOrbit);
    
    scene.add(Neptune);
    scene.add(NeptuneOrbit);
    
    
    //camera
    camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.1, 50000 );
    camera.position.x = 1000;
    camera.position.y = 700;
    
    // orbit controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY
    };
    controls.minDistance = 100
    controls.maxDistance = 1500
    controls.maxPolarAngle = THREE.MathUtils.degToRad(90)
    controls.panSpeed = 1

    raycaster = new THREE.Raycaster();

    stats = new Stats();
    document.body.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize );

    document.addEventListener('click', onClick);
};

//Uses raytracing to click on objects
function onClick( event ){

    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( pointer, camera );

    const intersects = raycaster.intersectObjects( scene.children, true );

    //Select object first hit by raytracer and change color to red
    if ( intersects.length > 0 ) {
        if ( INTERSECTED != intersects[ 0 ].object) {
            if ( INTERSECTED ) INTERSECTED.material = INTERSECTED.originalMaterial;

            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.originalMaterial = INTERSECTED.material;
            INTERSECTED.material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
        }
    } else {
        if ( INTERSECTED ) INTERSECTED.material = INTERSECTED.originalMaterial;

        INTERSECTED = null;
    }
};

//Controls window resizing
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

};

//Animates "prints to the screen"
function animate() {

    requestAnimationFrame(animate);

    render()
    stats.update();
};

//Handles calculating planet orbits
function render() {

    // Orbit and rotation calculations
    CELESTIAL.starRotation(Sun);

    CELESTIAL.planetOrbit(Mercury);
    CELESTIAL.orbitRing(MercuryOrbit);
    
    CELESTIAL.planetOrbit(Venus);
    CELESTIAL.orbitRing(VenusOrbit);
    
    CELESTIAL.planetOrbit(Earth);
    CELESTIAL.moonOrbit(Lunar, Earth);
    CELESTIAL.orbitRing(EarthOrbit);

    CELESTIAL.planetOrbit(Mars);
    CELESTIAL.orbitRing(MarsOrbit);

    CELESTIAL.planetOrbit(Jupiter);
    CELESTIAL.orbitRing(JupiterOrbit);

    CELESTIAL.planetOrbit(Saturn);
    CELESTIAL.planetRingOrbit(SaturnRing ,Saturn);
    CELESTIAL.orbitRing(SaturnOrbit);

    CELESTIAL.planetOrbit(Uranus);
    CELESTIAL.planetRingOrbit(UranusRing ,Uranus);
    CELESTIAL.orbitRing(UranusOrbit);

    CELESTIAL.planetOrbit(Neptune);
    CELESTIAL.orbitRing(NeptuneOrbit);


    controls.update();
    renderer.render( scene, camera );
};