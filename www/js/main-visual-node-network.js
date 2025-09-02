const stage = document.getElementById("stage");
const stageWrap = document.getElementById("stage-container");
const NODE_RADIUS = 16, PADDING_X = 60, PADDING_Y = 60, LAYER_GAP = 180;
let layers=[], nodes=[], weights=[], biases=[], nodeElements=[];

const layerDefs = [
  {type:'input', out_sx:1, out_sy:1, out_depth:2},
  {type:'fc', num_neurons:6, activation:'relu'},
  {type:'fc', num_neurons:5, activation:'relu'},
  {type:'fc', num_neurons:4, activation:'relu'},
  {type:'softmax', num_classes:2}
];

function randomWeight(){return +((Math.random()*2-1)*0.8).toFixed(3);}
function weightStyle(w){return {cls:w>=0?'edge edge-pos':'edge edge-neg', width:1.2+Math.min(Math.abs(w),2)*2.4};}
function addSVG(tag,attrs){const el=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);stage.appendChild(el);return el;}
function clearStage(){stage.innerHTML="";nodeElements=[];}

function deriveCounts(defs){
  return defs.map(d=>{
    if(d.type==='input') return {count:(d.out_depth??1)*(d.out_sx??1)*(d.out_sy??1)};
    if(d.type==='fc') return {count:d.num_neurons};
    if(d.type==='softmax') return {count:d.num_classes};
    throw Error("Unsupported "+d.type);
  });
}

export function nodeNetworkBuild(defs, nodeClicked) {
  clearStage();
  layers = deriveCounts(defs);
  const H = 560;
  const W = PADDING_X*2 + (layers.length-1)*LAYER_GAP + 100; // dynamic width
  stage.setAttribute("viewBox", `0 0 ${W} ${H}`);

  nodes = layers.map((L, li)=>{
    const n = L.count, gap = (n>1)?(H-2*PADDING_Y)/(n-1):0;
    const x = PADDING_X + li*LAYER_GAP;
    return Array.from({length:n}, (_, i)=>({x, y:(n===1?H/2:PADDING_Y+i*gap)}));
  });

  weights = []; biases = [];
  for(let l=0;l<layers.length-1;l++){
    weights[l] = Array.from({length:nodes[l].length}, ()=>Array.from({length:nodes[l+1].length}, ()=>randomWeight()));
  }
  for(let l=1;l<layers.length;l++){
    biases[l] = Array.from({length:nodes[l].length}, ()=>randomWeight());
  }

  drawEdges(); drawNodes(nodeClicked); drawLabels(defs);
}

function drawEdges(){
  for(let l=0;l<weights.length;l++){
    for(let i=0;i<weights[l].length;i++){
      for(let j=0;j<weights[l][i].length;j++){
        const w = weights[l][i][j], {cls,width}=weightStyle(w);
        const from = nodes[l][i], to = nodes[l+1][j];
        const line = addSVG("line",{x1:from.x+NODE_RADIUS+3, y1:from.y, x2:to.x-NODE_RADIUS-3, y2:to.y, "stroke-width":width, class:cls});
        line.addEventListener("click",()=>showWeightInput(l,i,j,line));
      }
    }
  }
}

function drawNodes(nodeClicked) {
    nodes.forEach((layerNodes, li) => {
        layerNodes.forEach((pt, ni) => {
            const g = addSVG("g", {class: "node"});
            const c = addSVG("circle", {cx: pt.x, cy: pt.y, r: NODE_RADIUS});
            const t = addSVG("text", {x: pt.x, y: pt.y+4, "text-anchor": "middle"});
            t.textContent = ni;
            g.appendChild(c);
            g.appendChild(t);
            stage.appendChild(g);
            nodeElements.push({ layer: li, index: ni, circle: c});
            c.addEventListener("dblclick", () => showBiasInput(li, ni, pt));
            g.addEventListener("click",(e) => {
                e.preventDefault();
                nodeClicked(li, ni);
//                showNodePopup(li, ni, pt);
            });
        });
    });
}

function drawLabels(defs){
  const Y = 28;

  defs.forEach((def, li) => {
    const x = nodes[li]?.[0]?.x ?? (120 + li*LAYER_GAP);
    const label = `${li}: ${def.type}${def.activation ? ' ('+def.activation+')':''}`;
    const tx = addSVG('text', { x, y: Y, 'text-anchor':'middle' });
    tx.textContent = label;
    tx.setAttribute('fill', '#c9d4e6');
    tx.setAttribute('font-size', '13');
  });
}

// ======== POPUPS ========
function showWeightInput(l, i, j, line) {
    removePopupInputs();

    const vb = stage.viewBox.baseVal;
    const bbox = stage.getBoundingClientRect();

    const x1 = +line.getAttribute("x1");
    const y1 = +line.getAttribute("y1");
    const x2 = +line.getAttribute("x2");
    const y2 = +line.getAttribute("y2");

    // Midpoint of the line
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    const px = (mx - vb.x) / vb.width * bbox.width;
    const py = (my - vb.y) / vb.height * bbox.height;

    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "popup-input";
    inp.value = weights[l][i][j];
    inp.style.left = px + "px";
    inp.style.top = py + "px";

    inp.onblur = () => {
        const v = parseFloat(inp.value);
        if (!isNaN(v)) {
            weights[l][i][j] = v;
            const { cls, width } = weightStyle(v);
            line.setAttribute("stroke-width", width);
            line.setAttribute("class", cls);
        }
        inp.remove();
    };
    inp.onkeydown = e => { if (e.key === "Enter") inp.blur(); };

    stageWrap.appendChild(inp);
    inp.focus();
}

function showBiasInput(li, ni, pt) {
    removePopupInputs();

    const vb = stage.viewBox.baseVal;
    const bbox = stage.getBoundingClientRect();

    const bx = pt.x;
    const by = pt.y - NODE_RADIUS - 18;

    const px = (bx - vb.x) / vb.width * bbox.width;
    const py = (by - vb.y) / vb.height * bbox.height;

    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "popup-input";
    inp.value = biases[li][ni];
    inp.style.left = px + "px";
    inp.style.top = py + "px";

    inp.onblur = () => {
        const v = parseFloat(inp.value);
        if (!isNaN(v)) biases[li][ni] = v;
        inp.remove();
    };
    inp.onkeydown = e => { if (e.key === "Enter") inp.blur(); };

    stageWrap.appendChild(inp);
    inp.focus();
}

function removePopupInputs() { const ex = stageWrap.querySelector(".popup-input"); if (ex) ex.remove(); }
function removeNodePopup() { const ex = stageWrap.querySelector(".node-popup"); if (ex) ex.remove(); }

let currentOutsideListener = null;

function showNodePopup(layer, idx, pt) {
    removeNodePopup();

    // Remove previous outside click listener
    if(currentOutsideListener){
        document.removeEventListener("click", currentOutsideListener);
        currentOutsideListener = null;
    }

    const div = document.createElement("div");
    div.className = "node-popup";

    // Compute popup position relative to container
    const vb = stage.viewBox.baseVal;
    const bbox = stage.getBoundingClientRect();

    // Scale SVG coordinates to container pixels
    const px = (pt.x - vb.x) / vb.width * bbox.width;
    const py = (pt.y - vb.y) / vb.height * bbox.height;

    div.style.left = (px + 20) + "px"; // show to the right of node
    div.style.top = py + "px";

    div.innerHTML = `
        <h4>Layer ${layer}, Node ${idx}</h4>
        <button>Train</button>
        <button>Prune</button>
        <button>Duplicate</button>
        <button>Export</button>
    `;

    // Append inside the scrollable container so it moves with scrolling
    stageWrap.appendChild(div);

    // Close popup when clicking any button
    div.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", removeNodePopup);
    });

    // Close popup when clicking outside
    currentOutsideListener = function(e){
        if(!div.contains(e.target)){
            removeNodePopup();
            document.removeEventListener("click", currentOutsideListener);
            currentOutsideListener = null;
        }
    };
    setTimeout(() => document.addEventListener("click", currentOutsideListener), 0);
}

// ======== HIGHLIGHTS ========
export function nodeNetworkHighlightNodes(target_nodes) {
    nodeElements.forEach(n => { n.circle.style.filter=""; });
    target_nodes.forEach(t => {
        const node = nodeElements.find(n => n.layer === t.layer_idx && n.index === t.node_idx);
        if(node) {
            node.circle.style.filter=`drop-shadow(0 0 6px ${t.color_highlight}) drop-shadow(0 0 12px ${t.color_highlight})`;
        } else {
            console.log("not found");
        }
    });
}
