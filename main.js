import * as THREE from 'three';
import * as CELESTIAL from './celestialObjects';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';

let stats;
let renderer, scene, camera, controls, raycaster;

let INTERSECTED;
let targetPlanet = null;

const pointer = new THREE.Vector2();

//Initializing planets
const Sun = new CELESTIAL.Star(15, 3, "public_assets/textures/sun.jpg" );

const Mercury = new CELESTIAL.Planet(1,
    69815000 /* Distance from sun */,
    (392000000/1.205)/* Planet orbit speed */,
    3 /* Axis rotation speed */,
    0.027 /* Planet axis rotation */,
    "public_assets/textures/mercury.jpg" /* Texture */);

const Venus = new CELESTIAL.Planet(1.9,
    108500000 /* Distance from sun */,
    (684000000/3.075) /* Planet orbit speed */,
    0.05 /* Axis rotation speed */,
    177.36 /* Planet axis rotation */,
    "public_assets/textures/venus.jpg");

const Earth = new CELESTIAL.Planet(2,
    150700000 /* Distance from sun */,
    (942000000/5) /* Planet orbit speed */,
    0.05 /* Axis rotation speed */,
    23.5 /* Planet axis rotation */,
    "public_assets/textures/earth.jpg");
const Lunar = new CELESTIAL.Moon(1,
    4 /* Distance from sun */,
    (2420000/136.61) /* moon orbit speed */,
    0.05 /* Axis rotation speed */,
    "public_assets/textures/moon.jpg");

const Mars = new CELESTIAL.Planet(1.5,
    207940000 /* Distance from sun */,
    (1440000000/9.4) /* Planet orbit speed */,
    0.05 /* Axis rotation speed */,
    25 /* Planet axis rotation */,
    "public_assets/textures/mars.jpg");

const Jupiter = new CELESTIAL.Planet(7,
    749370000 /* Distance from sun */,
    (4770000000/60) /* Planet orbit speed */,
    0.05 /* Axis rotation speed */,
    3.13 /* Planet axis rotation */,
    "public_assets/textures/jupiter.jpg");

const Saturn = new CELESTIAL.Planet(6.5,
    1450400000 /* Distance from sun */,
    (9120000000/147) /* Planet orbit speed */,
    0.05 /* Axis rotation speed */,
    26.73 /* Planet axis rotation */,
    "public_assets/textures/saturn.jpg");
const SaturnRing = new CELESTIAL.PlanetRing(Saturn, 1, 5);

const Uranus = new CELESTIAL.Planet(5,
    2930100000 /* Distance from sun */,
    (18400000000/420) /* Planet orbit speed */,
    0.05 /* Axis rotation speed */,
    97.77 /* Planet axis rotation */,
    "public_assets/textures/uranus.jpg");
const UranusRing = new CELESTIAL.PlanetRing(Uranus, 3, 4)

const Neptune = new CELESTIAL.Planet(5,
    4472100000 /* Distance from sun */,
    (28100000000/825) /* Planet orbit speed */,
    0.05 /* Axis rotation speed */,
    28 /* Planet axis rotation */,
    "public_assets/textures/neptune.jpg");


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
    
    // //space HDRI
    const HDRIloader = new RGBELoader();
    HDRIloader.load('public_assets/textures/HDR_hazy_nebulae.hdr', function(texture){
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
    });
    
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
    
    
    //camera
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 50000 );
    camera.position.x = 700;
    camera.position.y = 700;
    
    // orbit controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY
    };
    controls.minDistance = 100
    controls.maxDistance = 5000
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

    if ( intersects.length > 0 ) {
        INTERSECTED = intersects[ 0 ].object

        if (intersects[ 0 ].object.position){

            if (intersects[ 0 ].object == Sun){
                controls.minDistance = 100
                
            } else {targetPlanet = INTERSECTED;
            controls.minDistance = 0}
            
        }

    } else {
        if ( INTERSECTED.position ) INTERSECTED = null;
        targetPlanet = INTERSECTED
        controls.minDistance = 100
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
    Sun.starRotation();

    Mercury.planetOrbit();
    
    Venus.planetOrbit();
    
    Earth.planetOrbit();
    Lunar.moonOrbit( Earth );

    Mars.planetOrbit();

    Jupiter.planetOrbit();

    Saturn.planetOrbit();
    SaturnRing.planetRingOrbit( Saturn );

    Uranus.planetOrbit();
    UranusRing.planetRingOrbit( Uranus );

    Neptune.planetOrbit();

    if (targetPlanet != null) {
        CELESTIAL.cameraOrbit(camera, targetPlanet)
        camera.lookAt(scene.position);
    }
    
    controls.update();
    renderer.render( scene, camera );
};