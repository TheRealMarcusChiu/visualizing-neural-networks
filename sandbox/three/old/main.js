import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';

// Renderer
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth/2, window.innerHeight/2);
document.body.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f14);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(15,15,15);
camera.lookAt(0,0,0);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Axes
scene.add(new THREE.AxesHelper(5));

// Grid
scene.add(new THREE.GridHelper(20, 20, 0x555555, 0x222222));

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
dirLight.position.set(10,20,10);
scene.add(dirLight);

// Hyperplane: x + y + z - 3 = 0
const A=1, B=1, C=1, D=-3;
const normal = new THREE.Vector3(A,B,C).normalize();
let point = new THREE.Vector3(0, 0, 0);
if (C !== 0) {
    point.z = -D/C;
} else if (B !== 0) {
    point.y = -D/B;
} else {
    point.x = -D/A;
}

const planeSize = 12;
const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
//const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), normal);
//planeGeo.applyQuaternion(quaternion);
//planeGeo.translate(point.x, point.y, point.z);

const planeMat = new THREE.MeshPhongMaterial({color:0xffaa33, side:THREE.DoubleSide, opacity:0.5, transparent:true});
const planeMesh = new THREE.Mesh(planeGeo, planeMat);
//scene.add(planeMesh);


const geometry = new THREE.PlaneGeometry(10, 10); // 10 units wide, 10 units high
const material = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide, opacity: 0.5, transparent: true}); // Grey color, render both sides
const plane = new THREE.Mesh(geometry, material);
//plane.rotation.x = -Math.PI / 2; // Rotate 90 degrees around the X-axis
//plane.position.y = 0; // Set its Y-position
scene.add(plane);


// Render loop
function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
