import * as THREE from '../three.module.js';
import { GLTFLoader } from '../GLTFLoader.js';

export class LivrRuntime {
    constructor(sceneId) {
        this.sceneId = sceneId;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setClearAlpha(0);
        this.renderer.xr.enabled = true;
        this.renderer.xr.setReferenceSpaceType('local');
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.systems = [];
    }

    addSystem(system) {
        this.systems.push(system);
        system.runtime = this;
        if (system.init) system.init();
    }

    start() {
        this.renderer.setAnimationLoop((t, f) => this.update(t, f));
    }

    update(time, frame) {
        for (const sys of this.systems) {
            if (sys.update) sys.update(time, frame);
        }
        this.renderer.render(this.scene, this.camera);
    }
}
