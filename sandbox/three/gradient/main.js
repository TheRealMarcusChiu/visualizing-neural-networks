import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas") });
renderer.setSize(400, 400);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(75, 400/400, 0.1, 1000);
camera.position.set(0, 3, 6);

const controls = new OrbitControls(camera, renderer.domElement);

// Plane geometry (lots of segments so it can deform)
const geometry = new THREE.PlaneGeometry(5, 5, 50, 50);
geometry.rotateX(-Math.PI / 2);

// Add a color attribute
const colors = new Float32Array(geometry.attributes.position.count * 3);
geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const material = new THREE.MeshStandardMaterial({
  vertexColors: true,
  side: THREE.DoubleSide,
  flatShading: true,
});

const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// Lights
scene.add(new THREE.AmbientLight(0x404040));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

const color = new THREE.Color();

// Update vertices and colors
function updateGeometry() {
  const positions = geometry.attributes.position;
  const cols = geometry.attributes.color;

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);

    // Wave function for y
    const y = Math.sin(x + Date.now() * 0.001) * Math.cos(z + Date.now() * 0.001);
    positions.setY(i, y);

    // Map y -> color (blue low, red high)
    const t = (y + 1) / 2; // normalize y to [0,1]
    color.setRGB(t, 0, 1 - t);

    cols.setXYZ(i, color.r, color.g, color.b);
  }

  positions.needsUpdate = true;
  cols.needsUpdate = true;
}

function animate() {
  requestAnimationFrame(animate);
  updateGeometry();
  renderer.render(scene, camera);
}
animate();
