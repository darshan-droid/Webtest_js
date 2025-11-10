import * as THREE from '../three.module.js';
import { GLTFLoader } from '../GLTFLoader.js';

export async function loadScene(runtime, sceneId) {
    const base = `./${sceneId}`;
    const meta = await (await fetch(`${base}.meta.json`)).json();
    const glb = await new Promise((res, rej) => {
        new GLTFLoader().load(`${base}.glb`, gltf => res(gltf.scene), undefined, rej);
    });
    runtime.scene.add(glb);
    return { meta, glb };
}
