import * as THREE from './node_modules/three';

export class Star extends THREE.Mesh{
    constructor(name, size, rotationSpeed, texture, textureLoader){
        //------------------------------------------------------------------
        // Texture and Mesh
        const starMesh = new THREE.SphereGeometry(size, 32, 32);
        const starTexture = new THREE.MeshBasicMaterial(
            {map: textureLoader.load(texture)});
        starTexture.generateMipmaps = true;
        starTexture.minFilter = THREE.LinearMipmapLinearFilter;
        super(starMesh, starTexture);
        //------------------------------------------------------------------
        this.name = name;
        this.size = size;
        this.rotationSpeed = rotationSpeed;
        this.texture = texture;
        this.rotation.y += 1;
    };

    starRotation(){
        this.rotation.y += 0.001
    };

    objectName(){
        return this.name
    }
};

//--------------------------------------------------------------------------------------------------------------------------------------------

export class Planet extends THREE.Mesh{
    constructor(name, size, planetOrbit, distancePerYear, rotationSpeed, axisTilt, texture, textureLoader){
        //------------------------------------------------------------------
        // Texture and Mesh
        const planetMesh = new THREE.SphereGeometry(size, 24, 24);
        const planetTexture = new THREE.MeshBasicMaterial(
            {map: textureLoader.load(texture)});
        planetTexture.generateMipmaps = true;
        planetTexture.minFilter = THREE.LinearMipmapLinearFilter;
        super(planetMesh, planetTexture);
        //------------------------------------------------------------------
        this.name = name;
        this.size = size;
        this.orbitRadius = planetOrbit / 3000000;
        this.orbitSpeed = distancePerYear / 600000000000;
        this.rotationSpeed = rotationSpeed;
        this.axisTilt = axisTilt;
        this.texture = texture;
    };

    planetOrbit(){
    
        this.position.x = this.orbitRadius * Math.cos(-this.orbitSpeed * Date.now());
        this.position.z = this.orbitRadius * Math.sin(-this.orbitSpeed * Date.now());
        this.rotation.x = THREE.MathUtils.degToRad(this.axisTilt)
        this.rotation.y += this.rotationSpeed
    };

    objectName(){
        return this.name
    }
};

//--------------------------------------------------------------------------------------------------------------------------------------------

export class Moon extends THREE.Mesh{
    constructor(planet, name, size, orbitRadius, orbitSpeed, rotationSpeed, texture, textureLoader){
        //------------------------------------------------------------------
        // Texture and Mesh
        const moonMesh = new THREE.SphereGeometry(size, 16, 16);
        const moonTexture = new THREE.MeshBasicMaterial(
            {map: textureLoader.load(texture)});
        moonTexture.generateMipmaps = true;
        moonTexture.minFilter = THREE.LinearMipmapLinearFilter;
        super(moonMesh, moonTexture);
        this.name = name;
        this.planet = planet;
        this.size = size;
        this.orbitRadius = orbitRadius;
        this.orbitSpeed = orbitSpeed / 9000000;
        this.rotationSpeed = rotationSpeed;
        this.texture = texture;
    };

    moonOrbit(){
        this.position.x = this.planet.position.x + this.orbitRadius * Math.cos(-this.orbitSpeed * Date.now());
        this.position.z = this.planet.position.z + this.orbitRadius * Math.sin(-this.orbitSpeed * Date.now());
    };

    hostPlanet(){
        return this.planet
    }

    objectName(){
        return this.name
    }
};

//--------------------------------------------------------------------------------------------------------------------------------------------

export class PlanetRing extends THREE.Mesh{
    constructor(planet, innerRadius, outerRadius){
        //------------------------------------------------------------------
        // Texture and Mesh
        const geometry = new THREE.RingGeometry( planet.size + innerRadius, planet.size + outerRadius, 24);
        const material = new THREE.MeshBasicMaterial( { color: 'lightgray', side: THREE.DoubleSide } );
        super( geometry, material )
        //------------------------------------------------------------------
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

//--------------------------------------------------------------------------------------------------------------------------------------------

export class AsteroidBelt extends THREE.Points {
    constructor(asteroidCount = 1500, innerRadius = 90, outerRadius = 110, color = 0xb2b2b2, size = 0.5) {
        //------------------------------------------------------------------
        // Generate asteroid positions
        const positions = new Float32Array(asteroidCount * 3);
        for (let i = 0; i < asteroidCount; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
            const height = (Math.random() - 0.5) * 2; // Small vertical spread

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
        }
        //------------------------------------------------------------------
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color,
            size,
            sizeAttenuation: true
        });

        super(geometry, material);
        this.name = "AsteroidBelt";

        // Make invisible to raycasting
        this.raycast = () => {};
    }

    rotateBelt(speed = 0.001) {
        this.rotation.y += speed;
    }
}

//--------------------------------------------------------------------------------------------------------------------------------------------

export function cameraOrbit( camera, planet ){
        camera.position.x = (planet.orbitRadius + 15) * Math.cos(-planet.orbitSpeed * Date.now());
        camera.position.z = (planet.orbitRadius + 15) * Math.sin(-planet.orbitSpeed * Date.now());
        camera.position.y = planet.position.y + 3
}

//--------------------------------------------------------------------------------------------------------------------------------------------

export function createOrbitPath(orbitRadius, color = 0x444466) {
    const curve = new THREE.EllipseCurve(
        0, 0,
        orbitRadius, orbitRadius
    );
    const points = curve.getPoints(100);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color,
        linewidth: 2,
        opacity: 0.3,      // Lower opacity for dim effect
        transparent: true  // Enable transparency
    });
    const ellipse = new THREE.LineLoop(geometry, material);
    ellipse.userData.isOrbitPath = true;
    ellipse.rotation.x = Math.PI / 2;
    return ellipse;
}