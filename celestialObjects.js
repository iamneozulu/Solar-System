import * as THREE from 'three';

export class Star extends THREE.Mesh{
    constructor(name, size, rotationSpeed, texture){
        const starMesh = new THREE.SphereGeometry(size, 32, 32);
        
        const starTexture = new THREE.MeshBasicMaterial(
            {map: new THREE.TextureLoader().load(texture)})

        starTexture.generateMipmaps = true;
        starTexture.minFilter = THREE.LinearMipmapLinearFilter;
            
        super( starMesh, starTexture );

        this.name = name
        this.size = size;
        this.rotationSpeed = rotationSpeed;
        this.texture = texture;
        this.rotation.y += 1
    };

    starRotation(){
        this.rotation.y += 0.001
    };

    objectName(){
        return this.name
    }
};

export class Planet extends THREE.Mesh{
    constructor(name, size, planetOrbit, distancePerYear, rotationSpeed, axisTilt, texture){

        const planetMesh = new THREE.SphereGeometry(size, 24, 24);

        const planetTexture = new THREE.MeshBasicMaterial(
            {map: new THREE.TextureLoader().load(texture)})

        planetTexture.generateMipmaps = true;
        planetTexture.minFilter = THREE.LinearMipmapLinearFilter;

        super( planetMesh, planetTexture );

        this.name = name
        this.size = size;
        this.orbitRadius = planetOrbit / 3000000;
        this.orbitSpeed = distancePerYear / 600000000000;
        this.rotationSpeed = rotationSpeed;
        this.axisTilt = axisTilt
        this.texture = texture;
    };

    planetOrbit(){
    
        this.position.x = this.orbitRadius * Math.cos(this.orbitSpeed * Date.now());
        this.position.z = this.orbitRadius * Math.sin(this.orbitSpeed * Date.now());
        this.rotation.x = THREE.MathUtils.degToRad(this.axisTilt)
        this.rotation.y += this.rotationSpeed
    };

    objectName(){
        return this.name
    }
};

export class Moon extends THREE.Mesh{
    constructor(planet, name, size, orbitRadius, orbitSpeed, rotationSpeed, texture){

        const moonMesh = new THREE.SphereGeometry(size, 16, 16);

        const moonTexture = new THREE.MeshBasicMaterial(
            {map: new THREE.TextureLoader().load(texture)})

        moonTexture.generateMipmaps = true;
        moonTexture.minFilter = THREE.LinearMipmapLinearFilter;
            
        super( moonMesh, moonTexture );

        this.name = name
        this.planet = planet
        this.size = size;
        this.orbitRadius = orbitRadius;
        this.orbitSpeed = orbitSpeed / 9000000;
        this.rotationSpeed = rotationSpeed;
        this.texture = texture;
    };

    moonOrbit(){
        this.position.x = this.planet.position.x + this.orbitRadius * Math.cos(this.orbitSpeed * Date.now());
        this.position.z = this.planet.position.z + this.orbitRadius * Math.sin(this.orbitSpeed * Date.now());
    };

    hostPlanet(){
        return this.planet
    }

    objectName(){
        return this.name
    }
};

export class PlanetRing extends THREE.Mesh{
    constructor(planet, innerRadius, outerRadius){

        const geometry = new THREE.RingGeometry( planet.size + innerRadius, planet.size + outerRadius, 24);

        const material = new THREE.MeshBasicMaterial( { color: 'lightgray', side: THREE.DoubleSide } );

        super( geometry, material )

        this.planet = planet
    };

    hostPlanet(){
        return this.planet
    }

    planetRingOrbit(){
        this.position.x = this.planet.position.x
        this.position.z = this.planet.position.z
        this.rotation.x = THREE.MathUtils.degToRad(this.planet.axisTilt + 270)
    };

};

export function cameraOrbit( camera, planet ){
        camera.position.x = (planet.orbitRadius + 20) * Math.cos(planet.orbitSpeed * Date.now());
        camera.position.z = (planet.orbitRadius + 20) * Math.sin(planet.orbitSpeed * Date.now());
        camera.position.y = planet.position.y + 3
}

// const bulbGeometry = new THREE.SphereGeometry( 0.02, 16, 8 );
// 				bulbLight = new THREE.PointLight( 0xffee88, 1, 100, 2 );

// 				bulbMat = new THREE.MeshStandardMaterial( {
// 					emissive: 0xffffee,
// 					emissiveIntensity: 1,
// 					color: 0x000000
// 				} );
// 				bulbLight.add( new THREE.Mesh( bulbGeometry, bulbMat ) );
// 				bulbLight.position.set( 0, 2, 0 );
// 				bulbLight.castShadow = true;
// 				scene.add( bulbLight );

// 				hemiLight = new THREE.HemisphereLight( 0xddeeff, 0x0f0e0d, 0.02 );
// 				scene.add( hemiLight );
