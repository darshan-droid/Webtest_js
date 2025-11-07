import * as THREE from './three.module.js';
import * as WebGPU from './WebGPU.js';
import { GLTFLoader } from './GLTFLoader.js';
import { WebXRButton } from './webxr-button.js';
//import { ExportEventToUnity } from './UnityBridge.js';

let scene, camera, renderer;
let reticle;
let hitTestSource = null;
let referenceSpace = null;

let gltfRoot = null;
let placedObject = null;

//callbacks for unity
const UnityCallQueue = [];
let unityReady = false;
function debugLog(msg) {
    console.log(msg);

    const box = document.getElementById('debugLog');
    if (!box) return;

    box.textContent += msg + "\n";
    box.scrollTop = box.scrollHeight;
}

function SetupXR() {
    const controller = renderer.xr.getController(0);
   // controller.addEventListener('select', onUserPlace);
    controller.addEventListener('selectEvent', () => {
        sendThreejsInput(1);
    });
    scene.add(controller);
    console.log("Controller's started");
}

async function initAR() {
    console.log("[WebAR] initAR start");

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        20
    );

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearAlpha(0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    document.body.appendChild(renderer.domElement);

    const arButton = document.createElement('button');
    arButton.className = 'webar-button';
    arButton.textContent = 'Enter AR';

    arButton.addEventListener('click', async () => {
        debugLog("[WebARButton] Requesting AR session...");

        try {
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test', 'anchors'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: {root:document.body}
            });

            debugLog("[WebARButton] AR session started ");

            renderer.xr.setSession(session);
            SetupXR();
            await UnityLoader();

            // hide button when session active
            arButton.style.display = 'none';
        } catch (err) {
            console.error(err);
            debugLog("[WebARButton] Failed to start session: " + err.message);
        }
    });

    document.body.appendChild(arButton);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 1.0);
    scene.add(hemi);

    const ringGeo = new THREE.RingGeometry(0.07, 0.1, 32).rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: 0.9,
        transparent: true,
    });
    reticle = new THREE.Mesh(ringGeo, ringMat);
    reticle.visible = false;
    scene.add(reticle);

    //const loader = new GLTFLoader();
    //loader.load(
    //    './scene.glb',
    //    (gltf) => {
    //        console.log("[WebAR] GLB loaded");
    //        gltfRoot = gltf.scene;
    //        gltfRoot.visible = false;
    //    },
    //    undefined,
    //    (err) => console.error("[WebAR] Error loading GLB:", err)
    //);

    //window.addEventListener('click', (e) => {
    //    if (!renderer.xr.isPresenting) onUserPlace(e);
    //});

    renderer.setAnimationLoop(render);
}

async function setupHitTestSource(session) {
    console.log("[WebAR] setupHitTestSource called");

    const viewerSpace = await session.requestReferenceSpace('viewer');

    // Ask AR runtime for hit test source
    hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
    console.log("[WebAR] hitTestSource ready");

    try {
        referenceSpace = await session.requestReferenceSpace('local-floor');
        console.log("[WebAR] referenceSpace 'local-floor' ready");
    } catch (err1) {
        console.warn("[WebAR] 'local-floor' not supported, trying 'local'…", err1);
        try {
            referenceSpace = await session.requestReferenceSpace('local');
            console.log("[WebAR] referenceSpace 'local' ready");
        } catch (err2) {
            console.warn("[WebAR] 'local' not supported, trying 'viewer' as fallback…", err2);
            referenceSpace = await session.requestReferenceSpace('viewer');
            console.log("[WebAR] referenceSpace 'viewer' fallback ready");
        }
    }
}

function render(timestamp, frame) {
    const session = renderer.xr.getSession();
    if (!session) {
        renderer.render(scene, camera);
        return;
    }

    // Prevents repeated setup attempts
    if (!hitTestSource && frame) {
        console.log("[WebAR] render(): session detected, setting up hit test");
        setupHitTestSource(session).catch(err => {
            console.warn("[WebAR] setupHitTestSource failed:", err);
        });
    }

    if (frame && hitTestSource && referenceSpace) {
        const hits = frame.getHitTestResults(hitTestSource);

        if (hits.length > 0) {
            const hit = hits[0].getPose(referenceSpace);
            reticle.visible = true;
            reticle.position.set(
                hit.transform.position.x,
                hit.transform.position.y,
                hit.transform.position.z
            );

            //if (gltfRoot && !gltfRoot.visible) {
            //    gltfRoot.visible = true;
            //    gltfRoot.position.copy(reticle.position);
            //    gltfRoot.scale.set(1, 1, 1);
            //    console.log("[WebAR] placed GLB at", reticle.position);
            //}
        } else {
            reticle.visible = false;
        }
    }

    renderer.render(scene, camera);
}

//function onUserPlace(event) {
//    console.log("[WebAR] onUserPlace fired",event);

//    //if (!surfaceReady) {
//    //    console.warn("[WebAR] surfaceReady=false (no plane yet)");
//    //    return;
//    //}
//    //if (!gltfRoot) {
//    //    console.warn("[WebAR] gltfRoot not loaded yet");
//    //    return;
//    //}

//    if (!placedObject) {
//        placedObject = gltfRoot.clone(true);
//        placedObject.visible = true;
//        placedObject.scale.set(1, 1, 1);

//        scene.add(placedObject);
//        console.log("[WebAR] placed first object");
//    } else {
//        console.log("[WebAR] moving existing object");
//    }

//    placedObject.position.copy(reticle.position);
//    placedObject.quaternion.copy(reticle.quaternion);
//    //placedObject.position.y += 0.02;

//    console.log("[WebAR] placedObject @", placedObject.position);
//}

/**
 * This below is for Unity and three js integration
 */
window.UnityLoadedandReady = function () {
    console.log("Unity is Ready");

    UnityCallQueue.forEach(call => {
        if (typeof window[call[0]] === 'function') {
            window[call[0]](call[1]);
        }
    });
    UnityCallQueue.length = 0;
};
function sendThreejsInput(button) {
    const data = "Button" + button + "Clicked";

    if (unityReady && typeof ExportEventToUnity === 'function') {
        ExportEventToUnity(data);
        console.log("app.js communicates with UnityBridge");
    }
    else {
        console.warn('App doesnt communicate ${data}');
    }
    
}

//global declaration for unity instance
//const { createUnityInstance } = await import("./Build/UnityProject.loader.js");
async function UnityLoader() {
    const unityCanvas = document.getElementById('unity-canvas');
    unityCanvas.style.display = 'block'; // make visible if needed

    const buildUrl = "./Build"; // folder with Unity files
    const config = {
        dataUrl: buildUrl + "/UnityProject.data",
        frameworkUrl: buildUrl + "/UnityProject.framework.js",
        codeUrl: buildUrl + "/UnityProject.wasm",
        streamingAssetsUrl: "StreamingAssets",
        companyName: "YourCompany",
        productName: "YourApp",
        productVersion: "1.0",
        showBanner: (msg, type) => console.log("[Unity] " + msg)
    };

    const LoaderModule = await import(buildUrl + "/UnityProject.loader.js");

    const createUnityInstance = LoaderModule.default;
    console.log("InspectModule:", LoaderModule);
    console.log("InspectCreateUI", createUnityInstance);
    const unityInstance = await LoaderModule.createUnityInstance(unityCanvas, config, (progress) => {
        debugLog(`[Unity] Loading progress: ${Math.round(progress * 100)}%`);
    }).then((unityInstance) => {
        debugLog("[Unity] Scene loaded!");
        window.unityInstance = unityInstance;
        unityReady = true;
        if (typeof window.UnityLoadedandReady === 'function') window.UnityLoadedandReady();
    }).catch((err) => {
        console.error("[UnityBridge] Failed to load Unity scene:", err);
    });
}

initAR();

