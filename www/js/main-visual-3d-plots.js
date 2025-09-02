
export function renderCanvasInput(canvas, training_data, training_data_estimates, addTrainingDataCallBack) {
    // Scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e1e);

    const camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true});
    renderer.setSize(canvas.width, canvas.height);
//    document.body.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;

    // Axes & Grid
    scene.add(new THREE.AxesHelper(20));
    scene.add(new THREE.GridHelper(20, 20, 0x404040, 0x404040));

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
    const dirLight = new THREE.DirectionalLight(0xAAAAAA, 1);
    dirLight.position.set(20, 50, 20);
    scene.add(dirLight);
//    scene.add(new THREE.AmbientLight(0x404040));

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
    const trainingDataSpheres = [];

    // Function to add a point
    function addPoint(x, y, z, label) {
        const color = label === 0 ? {color: 0xff0000} : {color: 0x00ff00};
        const sphereGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const sphereMat = new THREE.MeshBasicMaterial(color);
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        sphere.position.set(x, y, z);
        scene.add(sphere);
        trainingDataSpheres.push(sphere);
    }

    // add data points
    for (let i = 0; i < training_data.length; i++) {
        const x = training_data[i].input[0];
        const z = training_data[i].input[1];
        const y = training_data_estimates[i];
        const label = training_data[i].label;
        addPoint(x, y, z, label);
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
            addTrainingDataCallBack(point.x, point.z, label);
        }
    }

    renderer.domElement.addEventListener('dblclick', onClick);

    return {scene, camera, renderer, controls, planeMeshPosition, planeMeshSpheres, trainingDataSpheres};
}

export function renderCanvasOther(canvas) {

    // Scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e1e);

    const camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true});
    renderer.setSize(canvas.width, canvas.height);
//    document.body.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;

    // Axes & Grid
    scene.add(new THREE.AxesHelper(20));
    scene.add(new THREE.GridHelper(20, 20, 0x404040, 0x404040));


    // Plane
    const width = 20;
    const depth = 20;
    const segmentsX = 90;
    const segmentsZ = 90;
    const geometry = new THREE.PlaneGeometry(width, depth, segmentsX-1, segmentsZ-1);
    geometry.rotateX(-Math.PI/2); // horizontal
    const material = new THREE.MeshStandardMaterial({color: 0x03d9ff, wireframe: true});
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Lighting
    const dirLight = new THREE.DirectionalLight(0xAAAAAA, 1);
    dirLight.position.set(20, 50, 20);
    scene.add(dirLight);
//    scene.add(new THREE.AmbientLight(0x404040));

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
