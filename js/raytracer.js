var gl; // A global variable for the WebGL context
var objects;
var w;
var output;
var context;
var pixelWidth = 4;

function start() {
  var glcanvas = document.getElementById("glcanvas");
  var canvas2d = document.getElementById("canvas2d");
  context = canvas2d.getContext("2d");

  // Initialize the GL context
  gl = initWebGL(glcanvas);
  
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

function Shape(type, location, radius, ambient, diffuse, specular, color, reflective, refractive) {
	this.type = type;
	this.location = location;
	this.radius = radius;
	this.diffuse = diffuse;
	this.specular = specular;
	this.ambient = ambient;
	this.color = color;
	this.reflective = reflective;
	this.refractive = refractive;
}

function initWebGL(canvas) {
  gl = null;
  objects = [];
  output = document.getElementById('output');
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	//initialize the default objects
	var sphere = new Shape("SPHERE",[250,250,10],100,[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1],[1,255,1],1,0);
	var sphere2 = new Shape("SPHERE",[100,100,100],50,[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1], [1,255,1],1,0);
	var sphere3 = new Shape("SPHERE",[450,450,900],20,[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1], [1,255,1],1,0);
	var plane = new Shape;
	plane.plane = [-1,0,0,455];
	plane.diffuse = [0.8,0.8,0.8];
	plane.specular = [1,1,1];
	plane.ambient = [0.2,0.2,0.2];
	plane.color = [255,1,1];
	plane.reflective = 1;
	plane.refractive = 0;
	plane.type = "PLANE";
	
	
	var triangle = new Shape;
	triangle.point1 = [0,0,0];
	triangle.point2 = [200,10,55];
	triangle.point3 = [300,200,0];
	triangle.type = "POLYGON";
	triangle.diffuse = [0.8,0.8,0.8];
	triangle.specular = [1,1,1];
	triangle.ambient = [0.2,0.2,0.2];
	triangle.color = [1,1,255];
	triangle.reflective = 1;
	triangle.refractive = 0;
	triangle.plane = generatePlane(triangle.point1,triangle.point2,triangle.point3);
	
	
	//add the default object to the list
	objects.push(sphere);
	objects.push(sphere2);
	objects.push(sphere3);
	objects.push(plane);
	objects.push(triangle);
  }
  catch(e) {}
  
  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    gl = null;
  }
  
  return gl;
}

//determine the plane of the polygon
function generatePlane(point1, point2, point3)
{
	var vector1 = [point2[0]-point1[0],point2[1]-point1[1],point2[2]-point1[2]];
	var vector2 = [point3[0]-point2[0],point3[1]-point2[1],point3[2]-point2[2]];
	var crossproduct = [(vector1[1]*vector2[2] - vector1[2]*vector2[1]),
						(vector1[2]*vector2[0] - vector1[0]*vector2[2]),
						(vector1[0]*vector2[1] - vector1[1]*vector2[0])];
	return [-crossproduct[0],-crossproduct[1],-crossproduct[2],
		(crossproduct[0]*(-point1[0])+crossproduct[1]*(-point1[1])+crossproduct[2]*(-point1[2]))];
}

function startWorker() {
	if(typeof(Worker) !== "undefined") {
		if(typeof(w) == "undefined") {
			w = new Worker("js/generate_image.js");
			w.postMessage = w.webkitPostMessage || w.postMessage;
			
			w.postMessage([JSON.stringify(objects),480,640,pixelWidth]);
		}
		w.onmessage = function(event) {
			if(event.data.startsWith("ROW:")){
				output.innerHTML += event.data;
				var pixels = (event.data.substring(4)).split(',');
				var x = pixels[0];
				for(var j = 1; j < pixels.length-1; j+=3)
				{
					context.fillStyle = "rgb("+pixels[j]+","+pixels[j+1]+","+pixels[j+2]+")";
					context.fillRect(((j-1)/3)*pixelWidth, x*pixelWidth, pixelWidth, pixelWidth );
				}
			}
			else
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

