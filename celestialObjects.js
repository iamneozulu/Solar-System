import * as THREE from 'three';

export class Star extends THREE.Mesh{
    constructor(size, rotationSpeed, texture){
        const starTexture = new THREE.SphereGeometry(size, 32, 32);
        starTexture.generateMipmaps = true;
        starTexture.minFilter = THREE.LinearMipmapLinearFilter;

        const starMesh = new THREE.MeshBasicMaterial(
            {map: new THREE.TextureLoader().load(texture)})

        super( starTexture, starMesh );

        this.size = size;
        this.rotationSpeed = rotationSpeed;
        this.texture = texture;
        this.rotation.y += 1
    };
};

export class Planet extends THREE.Mesh{
    constructor(size, planetOrbit, distancePerYear, rotationSpeed, texture){
        const planetTexture = new THREE.SphereGeometry(size, 16, 16);
        planetTexture.generateMipmaps = true;
        planetTexture.minFilter = THREE.LinearMipmapLinearFilter;

        const planetMesh = new THREE.MeshBasicMaterial(
            {map: new THREE.TextureLoader().load(texture)})

        super( planetTexture, planetMesh );

        this.size = size;
        this.orbitRadius = planetOrbit * 20;
        this.orbitSpeed = distancePerYear / 600000000000;
        this.rotationSpeed = rotationSpeed;
        this.texture = texture;
    };
};

export class Moon extends THREE.Mesh{
    constructor(size, orbitRadius, orbitSpeed, rotationSpeed, texture){
        const moonTexture = new THREE.SphereGeometry(size, 8, 8);
        moonTexture.generateMipmaps = true;
        moonTexture.minFilter = THREE.LinearMipmapLinearFilter;

        const moonMesh = new THREE.MeshBasicMaterial(
            {map: new THREE.TextureLoader().load(texture)})

        super( moonTexture, moonMesh );

        this.size = size;
        this.orbitRadius = orbitRadius;
        this.orbitSpeed = orbitSpeed / 9000000;
        this.rotationSpeed = rotationSpeed;
        this.texture = texture;
    };
};

export function starRotation(star){
    star.rotation.y += 0.001
}

export function planetOrbit(planet){
    planet.position.x = planet.orbitRadius * Math.cos(planet.orbitSpeed * Date.now());
    planet.position.z = planet.orbitRadius * Math.sin(planet.orbitSpeed * Date.now());
    planet.rotation.y += planet.rotationSpeed
};

export function moonOrbit(moon, planet){
    planet.position.x = planet.orbitRadius * Math.cos(planet.orbitSpeed * Date.now());
    planet.position.z = planet.orbitRadius * Math.sin(planet.orbitSpeed * Date.now());

    moon.position.x = planet.position.x + moon.orbitRadius * Math.cos(moon.orbitSpeed * Date.now());
    moon.position.z = planet.position.z + moon.orbitRadius * Math.sin(moon.orbitSpeed * Date.now());
}