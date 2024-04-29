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
const Sun = new CELESTIAL.Star(10, 3, "public_assets/textures/sun.jpg" )
const Mercury = new CELESTIAL.Planet(1, 1, (392000000/1.205), 3, "public_assets/textures/mercury.jpg")
const Venus = new CELESTIAL.Planet(1.9, 2, (684000000/3.075), 3, "public_assets/textures/venus.jpg")
const Earth = new CELESTIAL.Planet(2, 3, (942000000/5), 3, "public_assets/textures/earth.jpg")
const Lunar = new CELESTIAL.Moon(1, 4, (2420000/136.61), 3, "public_assets/textures/moon.jpg")
const Mars = new CELESTIAL.Planet(1.5, 4, (1440000000/9.4), 3, "public_assets/textures/mars.jpg")
const Jupiter = new CELESTIAL.Planet(5, 8, (4770000000/60), 3, "public_assets/textures/jupiter.jpg")
const Saturn = new CELESTIAL.Planet(4.5, 10, (9120000000/147), 3, "public_assets/textures/saturn.jpg")
const Uranus = new CELESTIAL.Planet(4, 12, (18400000000/420), 3, "public_assets/textures/uranus.jpg")
const Neptune = new CELESTIAL.Planet(4, 15, (28100000000/825), 3, "public_assets/textures/neptune.jpg")


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
    scene.add(Venus);
    scene.add(Earth);
    scene.add(Lunar);
    scene.add(Mars);
    scene.add(Jupiter);
    scene.add(Saturn);
    scene.add(Uranus);
    scene.add(Neptune);
    
    
    //camera
    camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.1, 50000 );
    camera.position.x = 500;
    camera.position.y = 100;
    
    // orbit controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY
    };
    controls.minDistance = 100
    controls.maxDistance = 1000
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

    //Orbit and rotation calculations
    CELESTIAL.starRotation(Sun);
    CELESTIAL.planetOrbit(Mercury);
    CELESTIAL.planetOrbit(Venus);
    CELESTIAL.planetOrbit(Earth);
    CELESTIAL.moonOrbit(Lunar, Earth);
    CELESTIAL.planetOrbit(Mars);
    CELESTIAL.planetOrbit(Jupiter);
    CELESTIAL.planetOrbit(Saturn);
    CELESTIAL.planetOrbit(Uranus);
    CELESTIAL.planetOrbit(Neptune);

    controls.update();
    renderer.render( scene, camera );
};