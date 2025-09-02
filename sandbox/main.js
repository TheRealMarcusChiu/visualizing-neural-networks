var data, labels, N;
var ss = 30.0; // scale for drawing

var layer_defs, net, trainer;

var lix = 0; // layer id to track first 2 neurons of
var d0 = 0; // first dimension to show visualized
var d1 = 1; // second dimension to show visualized

function reload() {
  eval($("#layerdef").val());

  // enter buttons for layers
  var t = '';
  for (var i = 0; i < net.layers.length - 1; i++) { // ignore input and regression layers (first and last)
    var butid = "button" + i;
    t += "<input id=\""+butid+"\" value=\"" + net.layers[i].layer_type + "(" + net.layers[i].out_depth + ")" +"\" type=\"submit\" onclick=\"updateLix("+i+")\" style=\"width:80px; height: 30px; margin:5px;\";>";
  }
  $("#layer_ixes").html(t);
  updateLix(lix)
}

function updateLix(newlix) {
  $("#button" + lix).css('background-color', ''); // erase highlight
  lix = newlix;
  d0 = 0;
  d1 = 1; // reset these
  $("#button"+lix).css('background-color', '#FFA');

  $("#cyclestatus").html('drawing neurons ' + d0 + ' and ' + d1 + ' of layer with index ' + lix + ' (' + net.layers[lix].layer_type + ')');
}

function circle_data() {
    data = [];
    labels = [];
    for (var i = 0; i < 5; i++) {
        var r = convnetjs.randf(0.0, 2.0);
        var t = convnetjs.randf(0.0, 2*Math.PI);
        data.push([r*Math.sin(t), r*Math.cos(t)]);
        labels.push(1);
    }
    for (var i = 0; i < 50; i++) {
        var r = convnetjs.randf(3.0, 5.0); // var t = convnetjs.randf(0.0, 2*Math.PI);
        var t = 2 * Math.PI * i / 50.0;
        data.push([r*Math.sin(t), r*Math.cos(t)]);
        labels.push(0);
    }
    N = data.length;
}

function linear_data() {
    data = [];
    labels = [];

    data.push([4, 3]);
    labels.push(1);
    data.push([3, 3]);
    labels.push(0);

    N = data.length;
}

var tt = 0;
function update() {
    tt++;
    if (tt < 50) {
        console.log("training");
        for (var iters = 0; iters < 20; iters++) {
            for (var i = 0; i < N; i++) {
                var x = new convnetjs.Vol(1, 1, 2);
                x.w = data[i];
                trainer.train(x, labels[i]);
            }
        }
    }
}

function draw() {

    var netx = new convnetjs.Vol(1, 1, 2);

    /////////////////
    // CANVAS ORIG //
    /////////////////

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    var gridstep = 10;
    var gridx = [];
    var gridy = [];
    var gridl = [];

    for (var x = 0.0; x <= WIDTH; x += gridstep) {
        for (var y = 0.0; y <= HEIGHT; y += gridstep) {
            netx.w[0] = (x - WIDTH/2) / ss;
            netx.w[1] = -(y - HEIGHT/2) / ss;
            var a = net.forward(netx);

            if (a.w[0] > a.w[1]) {
                ctx.fillStyle = 'rgb(250, 150, 150)';
            } else {
                ctx.fillStyle = 'rgb(150, 250, 150)';
            }
            ctx.fillRect(x - gridstep/2 - 1, y - gridstep/2 - 1, gridstep, gridstep);

            // record the transformation information
            gridx.push(net.layers[lix].out_act.w[d0]);
            gridy.push(net.layers[lix].out_act.w[d1]);
            gridl.push(a.w[0] > a.w[1]);
        }
    }



    ////////////
    // MY OWN //
    ////////////

    // direction of decision boundary Node #0
    ctx.fillStyle = 'rgb(255,0,0)';
    let node0_direction_0 = net.layers[1].filters[0].w[0];
    let node0_direction_1 = net.layers[1].filters[0].w[1];
    drawCircle(ctx, node0_direction_0 * ss + WIDTH/2, -node0_direction_1 * ss + HEIGHT/2, 5.0);

    // direction of decision boundary Node #1
    ctx.fillStyle = 'rgb(0,255,0)';
    let node1_direction_0 = net.layers[1].filters[1].w[0];
    let node1_direction_1 = net.layers[1].filters[1].w[1];
    drawCircle(ctx, node1_direction_0 * ss + WIDTH/2, -node1_direction_1 * ss + HEIGHT/2, 5.0);

    // slope stuff
    let slope_1 = net.layers[1].filters[0].w[0]/net.layers[1].filters[0].w[1];
    let slope_2 = net.layers[1].filters[1].w[0]/net.layers[1].filters[1].w[1];

    // node 1 decision boundary
    ctx.fillStyle = 'rgb(255,0,0)';
    let y_cross_1 = net.layers[1].biases.w[0]/net.layers[1].filters[0].w[1];
    drawCircle(ctx, 0.0 * ss + WIDTH/2, y_cross_1 * ss + HEIGHT/2, 5.0);
    let x_cross_1 = -net.layers[1].biases.w[0]/net.layers[1].filters[0].w[0];
    drawCircle(ctx, x_cross_1 * ss + WIDTH/2, 0.0 * ss + HEIGHT/2, 5.0);

    // node 2 decision boundary
    ctx.fillStyle = 'rgb(0,255,0)';
    let y_cross_2 = net.layers[1].biases.w[1]/net.layers[1].filters[1].w[1];
    drawCircle(ctx, 0.0 * ss + WIDTH/2, y_cross_2 * ss + HEIGHT/2, 5.0);
    let x_cross_2 = -net.layers[1].biases.w[1]/net.layers[1].filters[1].w[0];
    drawCircle(ctx, x_cross_2 * ss + WIDTH/2, 0.0 * ss + HEIGHT/2, 5.0);


    // draw axes
    ctx.beginPath();
    ctx.strokeStyle = 'rgb(0,0,0)';
    ctx.lineWidth = 1;
    ctx.moveTo(0, HEIGHT/2);
    ctx.lineTo(WIDTH, HEIGHT/2);
    ctx.moveTo(WIDTH/2, 0);
    ctx.lineTo(WIDTH/2, HEIGHT);
    ctx.stroke();



    ////////////////////////
    // CANVAS TRANSFORMED //
    ////////////////////////

    visctx.clearRect(0, 0, visWIDTH, visHEIGHT);

    // draw representation transformation axes for two neurons at some layer
    var mmx = cnnutil.maxmin(gridx);
    var mmy = cnnutil.maxmin(gridy);
    var n = Math.floor(Math.sqrt(gridx.length)); // size of grid. Should be fine?
    var ng = gridx.length;

    visctx.strokeStyle = 'rgb(50, 50, 50)';
    visctx.beginPath()

    for (var x = 0; x < n; x++) {
        for (var y = 0; y < n; y++) {

            // y grid lines
            var ix1 = x * n + y;
            var ix2 = x * n + y + 1;
            if (y < n-1) {
                xraw1 = visWIDTH * (gridx[ix1] - mmx.minv) / mmx.dv;
                yraw1 = visHEIGHT * (-gridy[ix1] - mmy.minv) / mmy.dv;
                xraw2 = visWIDTH * (gridx[ix2] - mmx.minv) / mmx.dv;
                yraw2 = visHEIGHT * (-gridy[ix2] - mmy.minv) / mmy.dv;
                visctx.moveTo(xraw1, yraw1);
                visctx.lineTo(xraw2, yraw2);
            }

            // draw its color
            if (gridl[ix1]) {
                visctx.fillStyle = 'rgb(250, 150, 150)';
            } else {
                visctx.fillStyle = 'rgb(150, 250, 150)';
            }
            visctx.fillRect(xraw1 - gridstep/2 - 1, yraw1 - gridstep/2 - 1, gridstep, gridstep);

            // x grid lines
            var ix1 = (x + 1) * n + y;
            var ix2 = x * n + y;
            if (x < n-1) {
                xraw1 = visWIDTH * (gridx[ix1] - mmx.minv) / mmx.dv;
                yraw1 = visHEIGHT * (-gridy[ix1] - mmy.minv) / mmy.dv;
                xraw2 = visWIDTH * (gridx[ix2] - mmx.minv) / mmx.dv;
                yraw2 = visHEIGHT * (-gridy[ix2] - mmy.minv) / mmy.dv;
                visctx.moveTo(xraw1, yraw1);
                visctx.lineTo(xraw2, yraw2);
            }

        }
    }

    visctx.stroke();



    /////////////////
    // DATA POINTS //
    /////////////////

    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.lineWidth = 1;
    for (var i = 0; i < N; i++) {

        if (labels[i] == 1) {
            ctx.fillStyle = 'rgb(100,200,100)';
            visctx.fillStyle = 'rgb(100,200,100)';
        } else {
            ctx.fillStyle = 'rgb(200,100,100)';
            visctx.fillStyle = 'rgb(200,100,100)';
        }

        // DRAW CIRCLES IN CANVAS ORIGINAL
        drawCircle(ctx, data[i][0] * ss + WIDTH/2, -data[i][1] * ss + HEIGHT/2, 5.0);

        // DRAW CIRCLES IN CANVAS TRANSFORMED
        netx.w[0] = data[i][0];
        netx.w[1] = data[i][1];
        var a = net.forward(netx);
        drawCircle(visctx,
            visWIDTH * (net.layers[lix].out_act.w[d0] - mmx.minv) / mmx.dv,
            visHEIGHT * (-net.layers[lix].out_act.w[d1] - mmy.minv) / mmy.dv,
            5.0);
    }

    ////////////
    // MY OWN //
    ////////////

    // eigenvector x
    visctx.fillStyle = 'rgb(0,0,255)';
    eigenvector_x0 = net.layers[1].filters[0].w[0];
    eigenvector_x1 = net.layers[1].filters[1].w[0];
    drawCircle(visctx,
        eigenvector_x0 * ss + WIDTH/2,
        -eigenvector_x1 * ss + HEIGHT/2,
        5.0);
    // eigenvector y
    visctx.fillStyle = 'rgb(0,255,255)';
    eigenvector_y0 = net.layers[1].filters[0].w[1];
    eigenvector_y1 = net.layers[1].filters[1].w[1];
    drawCircle(visctx,
        eigenvector_y0 * ss + WIDTH/2,
        -eigenvector_y1 * ss + HEIGHT/2,
        5.0);

//    // direction of decision boundary Node #0
//    visctx.fillStyle = 'rgb(255,0,0)';
//    drawCircle(visctx,
//        node0_direction_0 * ss + WIDTH/2,
//        -node0_direction_1 * ss + HEIGHT/2,
//        5.0);
//    // direction of decision boundary Node #1
//    visctx.fillStyle = 'rgb(0,255,0)';
//    drawCircle(visctx,
//        node1_direction_0 * ss + WIDTH/2,
//        -node1_direction_1 * ss + HEIGHT/2,
//        5.0);

    // transformed origin
    netx.w[0] = 0.0;
    netx.w[1] = 0.0;
    net.forward(netx);
    let new_origin_x_after = net.layers[lix].out_act.w[d0];
    let new_origin_y_after = net.layers[lix].out_act.w[d1];
    visctx.fillStyle = 'rgb(0,0,0)';
    drawCircle(visctx,
        visWIDTH * (new_origin_x_after - mmx.minv) / mmx.dv,
        visHEIGHT * (-new_origin_y_after - mmy.minv) / mmy.dv,
        5.0);

    visctx.beginPath();
    visctx.strokeStyle = 'rgb(0,0,0)';
    visctx.lineWidth = 1;
    visctx.moveTo(0, HEIGHT/2);
    visctx.lineTo(WIDTH, HEIGHT/2);
    visctx.moveTo(WIDTH/2, 0);
    visctx.lineTo(WIDTH/2, HEIGHT);
    visctx.stroke();
}

function mouseClick(x, y, shiftPressed, ctrlPressed) {
  // x and y transformed to data space coordinates
  var xt = (x - WIDTH/2)  / ss;
  var yt = -(y - HEIGHT/2) / ss;

  if (ctrlPressed) {
    // remove closest data point
    var mink = -1;
    var mind = 99999;
    for (var k = 0, n = data.length; k < n; k++) {
      var dx = data[k][0] - xt;
      var dy = data[k][1] - yt;
      var d = dx*dx+dy*dy;
      if(d < mind || k==0) {
        mind = d;
        mink = k;
      }
    }
    if (mink >= 0) {
      console.log('splicing ' + mink);
      data.splice(mink, 1);
      labels.splice(mink, 1);
      N -= 1;
    }
  } else {
    // add datapoint at location of click
    data.push([xt, yt]);
    labels.push(shiftPressed ? 1 : 0);
    N += 1;
  }
}

$(function() {
    viscanvas = document.getElementById('viscanvas');
    visctx = viscanvas.getContext('2d');
    visWIDTH = viscanvas.width;
    visHEIGHT = viscanvas.height;

    linear_data();
    reload();

    NPGinit(20);
});



//layer_defs = [];
//layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:2});
//layer_defs.push({type:'fc', num_neurons:1, activation: 'relu'});
//
//net = new convnetjs.Net();
//net.makeLayers(layer_defs);
//
//trainer = new convnetjs.SGDTrainer(net, {learning_rate:0.01, momentum:0.1, batch_size:10, l2_decay:0.001});
//
//var x = new convnetjs.Vol(1, 1, 2);
//x.w = [1, 1];
//console.log(net.forward(x).w);


