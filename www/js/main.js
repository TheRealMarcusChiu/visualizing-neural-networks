import { renderCanvasInput, renderCanvasOther } from './main-visual-3d-plots.js';
import { nodeNetworkBuild, nodeNetworkHighlightNodes } from './main-visual-node-network.js';



///////////////////////
// CODE EDITOR STUFF //
///////////////////////

const CODE = (
`

// Based on ConvNetJS
// documentation: https://cs.stanford.edu/people/karpathy/convnetjs/docs.html
layer_defs = [
     {type: 'input', out_sx: 1, out_sy: 1, out_depth: 2},   // DO NOT CHANGE THIS LAYER

     // --------- EDIT START -----------
     // ADD ANY NUMBER OF FC LAYERS (only supports relu and tanh)

     {type: 'fc', num_neurons: 6, activation: 'relu'},
     {type: 'fc', num_neurons: 5, activation: 'relu'},
     {type: 'fc', num_neurons: 4, activation: 'relu'},

     // --------- EDIT STOP -----------

     {type: 'softmax', num_classes: 2}                      // DO NOT CHANGE THIS LAYER
];`);

var editor;

require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' }});
require(['vs/editor/editor.main'], function() {

    // Create editor
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: CODE,
        language: 'javascript',
        theme: 'vs-dark',
        lineNumbers: 'off',     // no line numbers
        minimap: { enabled: false }, // hide minimap
        automaticLayout: true,
        contextmenu: false,
        fontSize: 12
    });

    // Listen for changes
    editor.onDidChangeModelContent(() => {
        const code = editor.getValue();
        console.clear();
        console.log('Current code:', code);
    });

    // Optional: handle resizing
    window.addEventListener('resize', () => editor.layout());

    doit();
});



function doit() {


function showTab(tabId) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active state from all buttons
    document.querySelectorAll('.tabs button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabId).classList.add('active');
}

////////////////////
// CovnetJS Stuff //
////////////////////

// Define NN Model Layers
var layer_defs;
var net;
var trainer;
function validateModel(layer_defs) {

    function validateLayerDef(layer_def) {
        const errors = [];

        const layer_type = layer_def.type;
        if (layer_type === "input") {
            if (parseInt(layer_def.out_depth) !== 2) {
                errors.push('softmax.num_classes should be 2');
            }
        } else if (layer_type === "fc") {
            if (layer_def.activation === "relu") {
            } else if (layer_def.activation === "tanh") {
                errors.push('tanh activation is not fully supported');
            } else {
                errors.push(layer_def.activation + ' activation is not yet supported');
            }
        }  else if (layer_type === "softmax") {
            if (parseInt(layer_def.num_classes) !== 2) {
                errors.push('softmax.num_classes should be 3');
            }
        } else {
            errors.push('type "' + layer_type + '" is not yet supported');
        }

        return errors;
    }

    const errors = layer_defs.map(layer_def => validateLayerDef(layer_def))
        .reduce((acc, curr) => acc.concat(curr), []);
    if (errors.length > 0) {
        alert(errors.join("\n"));
    }
}
function loadNetAndTrainer() {
    net = new convnetjs.Net();
    net.makeLayers(layer_defs);
    trainer = new convnetjs.SGDTrainer(net, {
        learning_rate: 0.01,
        momentum: 0.1,
        batch_size: 10,
        l2_decay: 0.001
    });
}
function loadModel() {
    eval(editor.getValue());
    validateModel(layer_defs);

    showTab("tab2-node-network");
    nodeNetworkBuild(layer_defs, setTarget);
    setTarget(targetLayerIndex, targetNodeIndex);

    counter = 0;
    if (counterDiv !== undefined) {
        counterDiv.textContent = counter;
    }

    loadNetAndTrainer();
    updateDropdownLayerOptions(layer_defs);
}
function editModel() {
    showTab("tab1-editor");
}
const editLoadModelButton = document.getElementById('edit-load-model');
editLoadModelButton.addEventListener('click', () => {
    if (editLoadModelButton.textContent === '⚙️') {
        editLoadModelButton.textContent = '💾';
        editModel();
    } else {
        editLoadModelButton.textContent = '⚙️';
        loadModel();
    }
});

// Training Data
const training_data = []; // array of { input: [], label: number 0 or 1 }
function addTrainingData(x, z, label) {
    training_data.push({ input: [x, z], label: label });
}
function generateTrainingDataCircle() {
    const new_data = [];

    function helper(innerRadius, outerRadius, label) {
        var r = convnetjs.randf(innerRadius, outerRadius);
        var t = convnetjs.randf(0.0, 2 * Math.PI);
//        var t = convnetjs.randf(0.0, 2*Math.PI);
        const x = r * Math.sin(t);
        const z = r * Math.cos(t);

        new_data.push({ input: [x, z], label: label });
    }

    for (var i = 0; i < 50; i++) {
        helper(0.0, 4.0, 1);
    }
    for (var i = 0; i < 50; i++) {
        helper(6.0, 9.0, 0);
    }

    return new_data;
}
function generateTrainingDataRandom() {
    const new_data = [];

    for (var i = 0; i < 50; i++) {
        const x = convnetjs.randf(-10.0, 10.0);
        const z = convnetjs.randf(-10.0, 10.0);
        const label = Math.round(Math.random());
        new_data.push({ input: [x, z], label: label });
    }

    return new_data;
}

generateTrainingDataCircle().forEach(({input, label}) => {
    addTrainingData(input[0], input[1], label);
});

// Allow Choosing Target (Layer & Node) Logic
var targetLayerIndex = 1;
var targetNodeIndex = 0;

function setTarget(layerIdx, nodeIdx) {
    if (layerIdx === 0) return;

    targetLayerIndex = layerIdx;
    targetNodeIndex = nodeIdx;

    updateDropdownLayerOptions(layer_defs);
}

function getNumNodes(layer_def) {
    if (layer_def.type === 'input') return 2;
    if (layer_def.type === 'fc') return layer_def.num_neurons;
    if (layer_def.type === 'softmax') return layer_def.num_classes;
}
function updateDropdownNodeOptions(layer_defs, newTargetNode) {
    const num_nodes = getNumNodes(layer_defs[targetLayerIndex]);
    const nodes = []; // { text, value }
    for (let i = 0; i < num_nodes; i++) {
        const text = "Node " + i;
        nodes.push({ text: text, value: i });
    }

    const previous_value = targetNodeIndex; //parseInt(dropdownNode.value);
    dropdownNode.innerHTML = "";
    nodes.forEach(({text, value}) => {
        dropdownNode.add(new Option(text, value));
    });

    if (typeof previous_value === "number" && isFinite(previous_value) && previous_value <= num_nodes) {
        dropdownNode.value = previous_value;
        targetNodeIndex = previous_value;
    } else {
        dropdownNode.value = 0;
        targetNodeIndex = 0;
    }

    targetLayerIndex = parseInt(targetLayerIndex);
    targetNodeIndex = parseInt(targetNodeIndex);

    nodeNetworkHighlightNodes([
      { layer_idx: targetLayerIndex, node_idx: targetNodeIndex, color_highlight:"#03d9ff" },
//      {layer_idx:1,node_idx:1,color_highlight:"#00AA00"}
    ]);
}
function getDescription(layer_def) {
    if (layer_def.type === 'fc') return 'fc (' + layer_def.activation + ')';
    if (layer_def.type === 'softmax') return 'fc (' + layer_def.type + ')';
    alert("something went wrong");
}
function updateDropdownLayerOptions(layer_defs) {
    const layers = []; // { text, value }
    for (let i = 1; i < layer_defs.length; i++) {
        const value = i;
        const text = i + ": " + getDescription(layer_defs[i]);
        layers.push({ text: text, value: value });
    }

    dropdownLayer.innerHTML = "";
    layers.forEach(({text, value}) => {
        dropdownLayer.add(new Option(text, value));
    });

    dropdownLayer.value = targetLayerIndex;
    updateDropdownNodeOptions(layer_defs);
    updateDropdownPrevNodesOptions(layer_defs);
}
var dropdownNode = document.getElementById("dropdown-node");
dropdownNode.addEventListener("change", () => {
    targetNodeIndex = parseInt(dropdownNode.value);
    nodeNetworkHighlightNodes([
      { layer_idx: targetLayerIndex, node_idx: targetNodeIndex, color_highlight:"#03d9ff" },
    ]);
});
var dropdownLayer = document.getElementById("dropdown-layer");
dropdownLayer.addEventListener("change", () => {
    targetLayerIndex = parseInt(dropdownLayer.value);
    updateDropdownNodeOptions(layer_defs);
    updateDropdownPrevNodesOptions(layer_defs);
});

// Undo Activation
var undoActivation = false;
const checkboxUndoActivation = document.getElementById("undo-activation");
checkboxUndoActivation.checked = undoActivation;
checkboxUndoActivation.addEventListener("change", function() {
    if (checkboxUndoActivation.checked) {
        undoActivation = true;
    } else {
        undoActivation = false;
        undoBias = false;
        checkboxUndoBias.checked = false;
    }
});

// Undo Bias
var undoBias = false;
const checkboxUndoBias = document.getElementById("undo-bias");
checkboxUndoBias.checked = undoBias;
checkboxUndoBias.addEventListener("change", function() {
    if (checkboxUndoBias.checked) {
        undoBias = true;
        undoActivation = true;
        checkboxUndoActivation.checked = true;
    } else {
        undoBias = false;
    }
});



///////////
// START //
///////////

const editCanvasInputInfoButton = document.getElementById("edit-canvas-input-info");
const editCanvasInputInfoPopup = document.getElementById("canvas-input-info-popup");
const editCanvasTargetInfoButton = document.getElementById("edit-canvas-target-info");
const editCanvasTargetInfoPopup = document.getElementById("canvas-target-info-popup");

const editCanvasTargetGearButton = document.getElementById("edit-canvas-target-gear");
const editCanvasTargetGearPopup = document.getElementById("canvas-target-gear-popup");
const dropdownListContainer = document.getElementById("dropdown-list-container");
const selectAllBtn = document.getElementById("select-all-prev-nodes");
const deselectAllBtn = document.getElementById("deselect-all-prev-nodes");

let numPrevNodes = 0;
var selectedPrevNodeIndices = [];
let lastCheckedIndex = null;

// Populate the dropdown list with checkboxes
function updateDropdownPrevNodesOptions(layer_defs) {
    numPrevNodes = getNumNodes(layer_defs[targetLayerIndex - 1]);

    dropdownListContainer.innerHTML = "";

    for (let i = 0; i < numPrevNodes; i++) {
        const text = "Node #" + (i + 1);
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = i;
        checkbox.checked = false;

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(text));
        dropdownListContainer.appendChild(label);

        // Shift+click support
        checkbox.addEventListener("click", (e) => {
            if (e.shiftKey && lastCheckedIndex !== null) {
                const start = Math.min(lastCheckedIndex, i);
                const end = Math.max(lastCheckedIndex, i);
                for (let j = start; j <= end; j++) {
                    const cb = dropdownListContainer.querySelectorAll("input")[j];
                    cb.checked = checkbox.checked;
                }
            }
            lastCheckedIndex = i;
            updateSelected();
            e.stopPropagation(); // Keep dropdown open
        });
    }

    updateSelected();
}

// Update displayed selected items
function updateSelected() {
    selectedPrevNodeIndices = Array.from(dropdownListContainer.querySelectorAll("input"))
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value));
}

// Select all
selectAllBtn.addEventListener("click", (e) => {
    dropdownList.querySelectorAll("input").forEach(cb => cb.checked = true);
    updateSelected();
    e.stopPropagation(); // Keep dropdown open
});

// Deselect all
deselectAllBtn.addEventListener("click", (e) => {
    dropdownList.querySelectorAll("input").forEach(cb => cb.checked = false);
    updateSelected();
    e.stopPropagation(); // Keep dropdown open
});

function toggleEditCanvasInputInfoPopup() {
    const computedDisplay = window.getComputedStyle(editCanvasInputInfoPopup).display;
    if (computedDisplay === "none") {
        const popup = document.getElementById("canvas-input-info-popup");
        popup.style.display = "flex";
    } else {
        const popup = document.getElementById("canvas-input-info-popup");
        popup.style.display = "none";  // hide it
    }
}

function toggleEditCanvasTargetInfoPopup() {
    const computedDisplay = window.getComputedStyle(editCanvasTargetInfoPopup).display;
    if (computedDisplay === "none") {
        const popup = document.getElementById("canvas-target-info-popup");
        popup.style.display = "flex";
    } else {
        const popup = document.getElementById("canvas-target-info-popup");
        popup.style.display = "none";  // hide it
    }
}

function toggleEditCanvasTargetGearPopup() {
    const computedDisplay = window.getComputedStyle(editCanvasTargetGearPopup).display;
    if (computedDisplay === "none") {
        const popup = document.getElementById("canvas-target-gear-popup");
        popup.style.display = "flex";
    } else {
        const popup = document.getElementById("canvas-target-gear-popup");
        popup.style.display = "none";  // hide it
    }
}

editCanvasInputInfoButton.addEventListener("click", (e) => {
    toggleEditCanvasInputInfoPopup();
});
editCanvasTargetInfoButton.addEventListener("click", (e) => {
    toggleEditCanvasTargetInfoPopup();
});
editCanvasTargetGearButton.addEventListener("click", (e) => {
    toggleEditCanvasTargetGearPopup();
});

// Click outside closes editCanvasTargetGearPopup
document.addEventListener("click", (e) => {
    if (!editCanvasTargetGearPopup.contains(e.target) && !editCanvasTargetGearButton.contains(e.target)) {
        editCanvasTargetGearPopup.style.display = "none";
    }
    if (!editCanvasInputInfoPopup.contains(e.target) && !editCanvasInputInfoButton.contains(e.target)) {
        editCanvasInputInfoPopup.style.display = "none";
    }
    if (!editCanvasTargetInfoPopup.contains(e.target) && !editCanvasTargetInfoButton.contains(e.target)) {
        editCanvasTargetInfoPopup.style.display = "none";
    }
});

// Initial update
updateSelected();

/////////
// END //
/////////



// Finally Load NN Model
loadModel();



////////////////////
// Training Logic //
////////////////////

function trainSingleIteration() {
    counter++;
    counterDiv.textContent = counter;
    var input = new convnetjs.Vol(1, 1, 2);
    for (var iters = 0; iters < 20; iters++) {
        for (var i = 0; i < training_data.length; i++) {
            input.w[0] = training_data[i].input[0];
            input.w[1] = training_data[i].input[1];
            trainer.train(input, training_data[i].label);
        }
    }
}
const button_training = document.getElementById('toggle-training');
let trainingIntervalID = null;
function startTraining() {
    playing = true;
    if (trainingIntervalID === null) { // prevent multiple intervals
        trainingIntervalID = setInterval(() => {
            trainSingleIteration();
        }, 125);
    }
}
function pauseTraining() {
    playing = false;
    if (trainingIntervalID !== null) {
        clearInterval(trainingIntervalID);
        trainingIntervalID = null;
    }
}
function toggleTraining() {
    playing = !playing;
    if (playing) {
        btnText.textContent = 'Pause';
        playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        startTraining();
    } else {
        btnText.textContent = 'Play';
        playIcon.innerHTML = '<polygon points="5,3 19,12 5,21"></polygon>';
        pauseTraining();
    }
}

var toggleBtn = document.getElementById('toggle-button');
var playIcon = document.getElementById('play-icon');
var btnText = document.getElementById('button-text');
var counterDiv = document.getElementById('counter');

var playing = false;
var counter = 0;

// Play/Pause toggle
toggleBtn.addEventListener('click', (e) => {
    if (e.target.closest('.dropdown')) return; // ignore clicks on dropdown
    toggleTraining();
});

toggleTraining();

// Dropdown toggle
const dropdown = document.getElementById('dropdown-container');
const dropdownBtn = dropdown.querySelector('.dropdown-btn');
dropdownBtn.addEventListener('click', (e) => {
    dropdown.classList.toggle('show');
    e.stopPropagation();
});

// Reset counter
document.getElementById('reset-counter').addEventListener('click', () => {
    loadModel();
    counter = 0;
    counterDiv.textContent = counter;
    dropdown.classList.remove('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});



////////////////////
// Three.js Stuff //
////////////////////

// each manifest obj is { scene, camera, renderer, controls, planeMeshPosition, planeMeshSpheres, trainingDataSpheres }
const manifests = [];

const training_data_estimates = training_data.map(({input}) => {
    var input_point = new convnetjs.Vol(1, 1, 2);
    input_point.w[0] = input[0];
    input_point.w[1] = input[1];
    return net.forward(input_point).w[1];
});
const manifest_input = renderCanvasInput(document.getElementById('canvas-input'), training_data, training_data_estimates, addTrainingData);
manifests.push(manifest_input);

const manifest_target = renderCanvasOther(document.getElementById('canvas-target'));
manifests.push(manifest_target);

function view2D(manifests) {
    manifests.forEach(m => {
        m.camera.position.set(0, 20, 0);
    });
}
['edit-canvas-input-2d', 'edit-canvas-target-2d'].forEach(id => {
    const elem = document.getElementById(id);
    elem.addEventListener("click", () => {
        view2D(manifests);
    });
});

view2D(manifests);

function mirrorCameraMovements(manifests) {
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
    }
}
mirrorCameraMovements(manifests);

// Animate Three.js Stuff
function softmax(arr) {
  // Shift values by max for numerical stability
  const maxVal = Math.max(...arr);
  const expVals = arr.map(x => Math.exp(x - maxVal));
  const sumExp = expVals.reduce((a, b) => a + b, 0);
  return expVals.map(v => v / sumExp);
}
function animate() {
    var input = new convnetjs.Vol(1, 1, 2);

    var planeMeshPosition = manifests[0].planeMeshPosition;
    var planeMeshSpheres = manifests[0].planeMeshSpheres;
    var trainingDataSpheres = manifests[0].trainingDataSpheres;

    for (let i = 0; i < trainingDataSpheres.length; i++) {
        input.w[0] = trainingDataSpheres[i].position.x;
        input.w[1] = trainingDataSpheres[i].position.z;
        const output = net.forward(input).w[1];

        trainingDataSpheres[i].position.y = output * 3;
    }

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

        // update canvas (target)
        if (targetLayerIndex !== undefined && targetNodeIndex !== undefined) {
//            let layerIndex = targetLayerIndex * 2 - 1;
//            if (!undoActivation) layerIndex += 1;
//            const output_node = net.layers[layerIndex].out_act.w[targetNodeIndex];
//            manifest_target.planeMeshPosition.setY(i, output_node * 3);

            let layerIndexPrev = (targetLayerIndex - 1) * 2;
            let layerIndexCurFC = layerIndexPrev + 1;
            let layerIndexCurAct = layerIndexPrev + 2;

            var output_node = 0;
            for (let j = 0; j < numPrevNodes; j++) {
                if (!selectedPrevNodeIndices.includes(j)) {
                    const prevNodeOutput = net.layers[layerIndexPrev].out_act.w[j];
                    const curWeight = net.layers[layerIndexCurFC].filters[targetNodeIndex].w[j]
                    output_node += prevNodeOutput * curWeight;
                }
            }

            if (!undoBias) {
                output_node += net.layers[layerIndexCurFC].biases.w[targetNodeIndex];

                if (!undoActivation) {
                    const act_type = net.layers[layerIndexCurAct].layer_type;
                    if (act_type === 'relu') {
                        if (output_node < 0) {
                            output_node = 0.0;
                        }
                    } else if (act_type === 'softmax') {
                        if (targetNodeIndex === 0) {
                            const other_node = net.layers[layerIndexCurFC].out_act.w[1];
                            const s = softmax([output_node, other_node]);
                            output_node = s[0];
                        } else {
                            const other_node = net.layers[layerIndexCurFC].out_act.w[0];
                            const s = softmax([other_node, output_node]);
                            output_node = s[1];
                        }
                    } else {
                    }
                }
            }

            manifest_target.planeMeshPosition.setY(i, output_node * 3);
        }
    }

    for (let i = 0; i < manifests.length; i++) {
        manifests[i].planeMeshPosition.needsUpdate = true;
        manifests[i].controls.update();
        manifests[i].renderer.render(manifests[i].scene, manifests[i].camera);
    }

    requestAnimationFrame(animate);
}
animate();

}