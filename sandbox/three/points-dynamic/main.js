import * as THREE from './lib/three.module.js';
import { OrbitControls } from './lib/OrbitControls.js';

const data = [];
const labels = [];
var layer_defs;
var net;
var trainer;

function createOriginalCanvas(canvas) {
    // Scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x444444);

    const camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true});
    renderer.setSize(canvas.width, canvas.height);
//    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    // Axes & Grid
    scene.add(new THREE.AxesHelper(20));

    // Plane
    const width = 20;
    const depth = 20;
    const segmentsX = 90;
    const segmentsZ = 90;
    const geometry = new THREE.PlaneGeometry(width, depth, segmentsX-1, segmentsZ-1);
    geometry.rotateX(-Math.PI/2); // horizontal
    const material = new THREE.MeshStandardMaterial({color: 0x00ffff, wireframe: true});
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(20, 50, 20);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0x404040));

    // --- Plane Mesh Points at Vertices
    const planeMeshPosition = geometry.attributes.position;
    const pointsGroup = new THREE.Group();
    scene.add(pointsGroup);

    const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const sphereMaterial = new THREE.MeshBasicMaterial({color: 0x000000});

    const planeMeshSpheres = [];

    for (let i = 0; i < planeMeshPosition.count; i++) {
        const x = planeMeshPosition.getX(i);
        const y = planeMeshPosition.getY(i);
        const z = planeMeshPosition.getZ(i);
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
        sphere.position.set(x, y, z);
        pointsGroup.add(sphere);
        planeMeshSpheres.push(sphere);
    }

    // Store Data Points
    const dataSpheres = [];

    // Function to add a point
    function addPoint(x, y, z, label) {
        const color = label === 0 ? {color: 0xff0000} : {color: 0x00ff00};
        const sphereGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const sphereMat = new THREE.MeshBasicMaterial(color);
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        sphere.position.set(x, y, z);
        scene.add(sphere);

        dataSpheres.push(sphere);
        data.push([x, z]);
        labels.push(label);
    }

    // Raycaster setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Click handler
    function onClick(event) {
        let label = event.shiftKey ? 0 : 1;

        const rect = renderer.domElement.getBoundingClientRect();

        // Normalize mouse coordinates (-1 to 1)
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(mesh);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            addPoint(point.x, point.y, point.z, label);
        }
    }

    renderer.domElement.addEventListener('dblclick', onClick);

    var input = new convnetjs.Vol(1, 1, 2);

    // generate sample data
    for (var i = 0; i < 50; i++) {
        var r = convnetjs.randf(0.0, 4.0);
        var t = convnetjs.randf(0.0, 2 * Math.PI);
        const x = r * Math.sin(t);
        const z = r * Math.cos(t);
        input.w[0] = x;
        input.w[1] = z;
        const output = net.forward(input).w[1];
        const y = output * 3;
        addPoint(x, y, z, 1);
    }
    for (var i = 0; i < 50; i++) {
        var r = convnetjs.randf(6.0, 9.0); // var t = convnetjs.randf(0.0, 2*Math.PI);
        var t = 2 * Math.PI * i / 50.0;
        const x = r * Math.sin(t);
        const z = r * Math.cos(t);
        input.w[0] = x;
        input.w[1] = z;
        const output = net.forward(input).w[1];
        const y = output * 3;
        addPoint(x, y, z, 0);
    }

    return {scene, camera, renderer, controls, planeMeshPosition, planeMeshSpheres, dataSpheres};
}

// Function to create a canvas with its own 3D scene
function createMeshCanvas(canvas) {

    // Scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x444444);

    const camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true});
    renderer.setSize(canvas.width, canvas.height);
//    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    // Axes & Grid
    scene.add(new THREE.AxesHelper(20));
    scene.add(new THREE.GridHelper(20, 20, 0x555555, 0x222222));


    // Plane
    const width = 20;
    const depth = 20;
    const segmentsX = 90;
    const segmentsZ = 90;
    const geometry = new THREE.PlaneGeometry(width, depth, segmentsX-1, segmentsZ-1);
    geometry.rotateX(-Math.PI/2); // horizontal
    const material = new THREE.MeshStandardMaterial({color: 0x00ffff, wireframe: true});
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(20, 50, 20);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0x404040));

    // --- Points at vertices
    const planeMeshPosition = geometry.attributes.position;
    const pointsGroup = new THREE.Group();
    scene.add(pointsGroup);

    const sphereGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const sphereMaterial = new THREE.MeshBasicMaterial({color: 0x000000});

//    const spheres = [];
//
//    for (let i=0; i<numVertices; i++){
//        const x = position.getX(i);
//        const y = position.getY(i);
//        const z = position.getZ(i);
//        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
//        sphere.position.set(x, y, z);
//        pointsGroup.add(sphere);
//        spheres.push(sphere);
//    }
//
//    // --- Animate mesh
//    let t = 0;
//    function animate() {
//        t += 0.03;
//
//        for (let i=0; i<numVertices; i++) {
//            const x = position.getX(i);
//            const z = position.getZ(i);
//            const y = Math.sin(Math.sqrt(x*x + z*z) * 1.5 - t) * 2;
//            position.setY(i, y);
//
//            // Update spheres
//    //        spheres[i].position.y = y;
//        }
//
//        position.needsUpdate = true;
//
//        controls.update();
//        renderer.render(scene, camera);
//        requestAnimationFrame(animate);
//    }
//
//    animate();

    return {scene, camera, renderer, controls, planeMeshPosition};
}

const manifests = [];
const manifests3 = [];
const manifests3to4_0 = [];
const manifests3to4_1 = [];
const manifests4 = [];

function view2D() {
    manifests.forEach(m => {
        m.camera.position.set(0, 20, 0);
    });
}
function view3D() {
    manifests.forEach(m => {
        m.camera.position.set(10, 10, 10);
    });
}
document.getElementById('view-2D').addEventListener('click', () => {
    view2D();
});
//document.getElementById('view-3D').addEventListener('click', () => {
//    view3D();
//});

const mirrorCameraMovementsListeners = [];
function mirrorCameraMovements() {
    for (let i = 0; i < manifests.length; i++) {
        const camera_i = manifests[i].camera;
        const listener = () => {
            for (let j = 0; j < manifests.length; j++) {
                if (i !== j) {
                    manifests[j].camera.position.copy(camera_i.position);
                    manifests[j].camera.quaternion.copy(camera_i.quaternion);
                }
            }
        }
        const controls = manifests[i].controls;
        controls.addEventListener('change', listener);
        mirrorCameraMovementsListeners.push({controls, listener});
    }
}
function unMirrorCameraMovements() {
    mirrorCameraMovementsListeners.forEach(({ controls, listener }) => {
        controls.removeEventListener('change', listener);
    });
    mirrorCameraMovementsListeners.length = 0;
}
//function toggleMirrorCameraMovements() {
//    if (button.textContent === 'Mirror Camera Movements') {
//        button.textContent = 'Un Mirror Camera Movements';
//        mirrorCameraMovements();
//    } else {
//        button.textContent = 'Mirror Camera Movements';
//        unMirrorCameraMovements();
//    }
//}
//const button = document.getElementById('toggle-mirror-camera-movements');
//button.addEventListener('click', () => {
//    toggleMirrorCameraMovements();
//});



function train() {
    console.log("training");
    for (var iters = 0; iters < 20; iters++) {
        for (var i = 0; i < data.length; i++) {
            var x = new convnetjs.Vol(1, 1, 2);
            x.w = data[i];
            trainer.train(x, labels[i]);
        }
    }
}

let intervalId = null;
function startInterval() {
    if (intervalId === null) { // prevent multiple intervals
        intervalId = setInterval(() => {
            train();
        }, 125);
    }
}
function stopInterval() {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}
function toggleTraining() {
    if (button_training.textContent === 'Start Training') {
        button_training.textContent = 'Pause Training';
        startInterval();
    } else {
        button_training.textContent = 'Start Training';
        stopInterval();
    }
}

const button_training = document.getElementById('toggle-training');
button_training.addEventListener('click', () => {
    toggleTraining();
});

const textArea = document.getElementById('layerdef');
function loadModel() {
    eval(textArea.value);
}
document.getElementById('load-model').addEventListener('click', () => {
    loadModel();
});

document.getElementById('log-layers').addEventListener('click', () => {
    console.log(net.layers);
});



//////////
// MAIN //
//////////

loadModel();

['canvas-input'].forEach(id => {
    const canvas = document.getElementById(id);
    manifests.push(createOriginalCanvas(canvas));
});

['canvas01', 'canvas02', 'canvas03'].forEach(id => {
    const canvas = document.getElementById(id);
    const m = createMeshCanvas(canvas);
    manifests.push(m);
    manifests3.push(m);
});
['canvas11', 'canvas12', 'canvas13'].forEach(id => {
    const canvas = document.getElementById(id);
    const m = createMeshCanvas(canvas);
    manifests.push(m);
    manifests3to4_0.push(m);
});
['canvas14', 'canvas15', 'canvas16'].forEach(id => {
    const canvas = document.getElementById(id);
    const m = createMeshCanvas(canvas);
    manifests.push(m);
    manifests3to4_1.push(m);
});
['canvas21', 'canvas22'].forEach(id => {
    const canvas = document.getElementById(id);
    const m = createMeshCanvas(canvas);
    manifests.push(m);
    manifests4.push(m);
});

// --- Animate
function animate() {
    var input = new convnetjs.Vol(1, 1, 2);

    var planeMeshPosition = manifests[0].planeMeshPosition;
    var planeMeshSpheres = manifests[0].planeMeshSpheres;
    var dataSpheres = manifests[0].dataSpheres;

    for (let i = 0; i < planeMeshPosition.count; i++) {
        input.w[0] = planeMeshPosition.getX(i);
        input.w[1] = planeMeshPosition.getZ(i);
        const output = net.forward(input).w[1];

        // update canvas (input)
        const output_position = output * 3;
        planeMeshPosition.setY(i, output_position);
        planeMeshSpheres[i].position.y = output_position;
        if (output > 0.5) {
            planeMeshSpheres[i].material.color.set(0x00AA00);
        } else {
            planeMeshSpheres[i].material.color.set(0xAA0000);
        }

        // update canvas (layer #3 nodes)
        for (let j = 0; j < 3; j++) {
            const output_node = net.layers[2].out_act.w[j];
            manifests3[j].planeMeshPosition.setY(i, output_node * 3);
        }

        // update canvas (layer #3 nodes -> layer #4 node #0)
        for (let j = 0; j < 3; j++) {
            const output_node = net.layers[2].out_act.w[j] * net.layers[3].filters[0].w[j] + net.layers[3].biases.w[0];
            manifests3to4_0[j].planeMeshPosition.setY(i, output_node * 3);
        }
        // update canvas (layer #3 nodes -> layer #4 node #1)
        for (let j = 0; j < 3; j++) {
            const output_node = net.layers[2].out_act.w[j] * net.layers[3].filters[1].w[j] + net.layers[3].biases.w[1];
            manifests3to4_1[j].planeMeshPosition.setY(i, output_node * 3);
        }

        // update canvas (layer #4 nodes)
        for (let j = 0; j < 2; j++) {
            const output_node = net.layers[3].out_act.w[j];
            manifests4[j].planeMeshPosition.setY(i, output_node * 3);
        }


        var output_node = 0;
        for (let j = 0; j < 2; j++) {
            output_node += net.layers[2].out_act.w[j] * net.layers[3].filters[1].w[j];
        }
        output_node += net.layers[3].biases.w[1];
        manifests4[0].planeMeshPosition.setY(i, output_node * 3);
    }

    for (let i = 0; i < dataSpheres.length; i++) {
        input.w[0] = dataSpheres[i].position.x;
        input.w[1] = dataSpheres[i].position.z;
        const output = net.forward(input).w[1];

        // update data spheres (input)
        dataSpheres[i].position.y = output * 3;
    }

    for (let i = 0; i < manifests.length; i++) {
        manifests[i].planeMeshPosition.needsUpdate = true;
        manifests[i].controls.update();
        manifests[i].renderer.render(manifests[i].scene, manifests[i].camera);
    }

    requestAnimationFrame(animate);
}
animate();


view2D();
mirrorCameraMovements();
toggleTraining();
