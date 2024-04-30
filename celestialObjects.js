import * as THREE from 'three';

export class Star extends THREE.Mesh{
    constructor(size, rotationSpeed, texture){
        const starMesh = new THREE.SphereGeometry(size, 32, 32);
        
        const starTexture = new THREE.MeshBasicMaterial(
            {map: new THREE.TextureLoader().load(texture)})

        starTexture.generateMipmaps = true;
        starTexture.minFilter = THREE.LinearMipmapLinearFilter;
            
        super( starMesh, starTexture );

        this.size = size;
        this.rotationSpeed = rotationSpeed;
        this.texture = texture;
        this.rotation.y += 1
    };
};

export class Planet extends THREE.Mesh{
    constructor(size, planetOrbit, distancePerYear, rotationSpeed, axisTilt, texture){

        const planetMesh = new THREE.SphereGeometry(size, 16, 16);

        const planetTexture = new THREE.MeshBasicMaterial(
            {map: new THREE.TextureLoader().load(texture)})

        planetTexture.generateMipmaps = true;
        planetTexture.minFilter = THREE.LinearMipmapLinearFilter;

        super( planetMesh, planetTexture );

        this.size = size;
        this.orbitRadius = planetOrbit * 20;
        this.orbitSpeed = distancePerYear / 600000000000;
        this.rotationSpeed = rotationSpeed;
        this.axisTilt = axisTilt
        this.texture = texture;
    };
};

export class Moon extends THREE.Mesh{
    constructor(size, orbitRadius, orbitSpeed, rotationSpeed, texture){
        const moonMesh = new THREE.SphereGeometry(size, 8, 8);
        
        const moonTexture = new THREE.MeshBasicMaterial(
            {map: new THREE.TextureLoader().load(texture)})

        moonTexture.generateMipmaps = true;
        moonTexture.minFilter = THREE.LinearMipmapLinearFilter;
            
        super( moonMesh, moonTexture );

        this.size = size;
        this.orbitRadius = orbitRadius;
        this.orbitSpeed = orbitSpeed / 9000000;
        this.rotationSpeed = rotationSpeed;
        this.texture = texture;
    };
};

export class PlanetRing extends THREE.Mesh{
    constructor(planet, innerCircumference, outCircumference){
        const geometry = new THREE.RingGeometry( planet.size + innerCircumference, planet.size + outCircumference, 24); 
        const material = new THREE.MeshBasicMaterial( { color: 'lightgray', side: THREE.DoubleSide } );

        super( geometry, material )
    };
};

export class OrbitRing extends THREE.Mesh{
    constructor(planet){
        const geometry = new THREE.RingGeometry( planet.orbitRadius-1, planet.orbitRadius+1, 62); 
        const material = new THREE.MeshBasicMaterial( { color: 'lightgray', side: THREE.DoubleSide } );

        super( geometry, material )
    }
}

export function starRotation(star){
    star.rotation.y += 0.001
};

export function planetOrbit(planet){
    
    planet.position.x = planet.orbitRadius * Math.cos(planet.orbitSpeed * Date.now());
    planet.position.z = planet.orbitRadius * Math.sin(planet.orbitSpeed * Date.now());
    planet.rotation.x = THREE.MathUtils.degToRad(planet.axisTilt)
    planet.rotation.y += planet.rotationSpeed
};

export function moonOrbit(moon, planet){
    // planet.position.x = planet.orbitRadius * Math.cos(planet.orbitSpeed * Date.now());
    // planet.position.z = planet.orbitRadius * Math.sin(planet.orbitSpeed * Date.now());

    moon.position.x = planet.position.x + moon.orbitRadius * Math.cos(moon.orbitSpeed * Date.now());
    moon.position.z = planet.position.z + moon.orbitRadius * Math.sin(moon.orbitSpeed * Date.now());
};

export function planetRingOrbit(ring, planet){
    ring.position.x = planet.position.x
    ring.position.z = planet.position.z
    ring.rotation.x = THREE.MathUtils.degToRad(planet.axisTilt + 270)
};

export function orbitRing(orbitRing){
    orbitRing.rotation.x = THREE.MathUtils.degToRad(270)
};
