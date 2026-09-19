import * as THREE from 'three';

export const loadingManager = new THREE.LoadingManager();

export const textureLoader = new THREE.TextureLoader(loadingManager);

function isCanvasTexture(texture) {
  const image = texture.image;
  return typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement;
}

export function disposeObject3D(root) {
  root.traverse((obj) => {
    if (obj.isScene && obj.background && obj.background.isTexture) {
      if (isCanvasTexture(obj.background)) obj.background.dispose();
    }
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (value && value.isTexture && isCanvasTexture(value)) value.dispose();
        }
        material.dispose();
      }
    }
  });
}