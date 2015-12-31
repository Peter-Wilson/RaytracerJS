var gl; // A global variable for the WebGL context
var objects;
var w;
var output;

function start() {
  var canvas = document.getElementById("glcanvas");

  // Initialize the GL context
  gl = initWebGL(canvas);
  
  // Only continue if WebGL is available and working
  
  if (gl) {
    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    // Near things obscure far things
    gl.depthFunc(gl.LEQUAL);
    // Clear the color as well as the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
}

function initWebGL(canvas) {
  gl = null;
  objects = [];
  output = document.getElementById('output');
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	//initialize the default objects
	var sphere;
	sphere.positionX = 0;
	sphere.positionY = 0;
	sphere.radius = 10;
	//add the default object to the list
	objects.push(sphere);
  }
  catch(e) {}
  
  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    gl = null;
  }
  
  return gl;
}

function startWorker() {
	if(typeof(Worker) !== "undefined") {
		if(typeof(w) == "undefined") {
			w = new Worker("js/generate_image.js");
		}
		w.onmessage = function(event) {
			output.innerHTML += event.data;
		};
	} else {
		output.innerHTML = "Sorry, your browser does not support Web Workers...";
	}
}

function stopWorker() { 
	w.terminate();
	w = undefined;
}

