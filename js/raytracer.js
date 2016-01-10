var gl; //the webGL canvas
var objects; //the 2d canvas
var w;
var output;
var context;
var pixelWidth = 1;
var light = new Object();
light.location = [-300,-300,-300];	
light.ambientI = 3;
light.lightI = 0.8;
light.specularF = 5;
var maxRecursions = 2;
var defaultColor = [0,0,0];
var glcanvas;
var canvas2d;
var overlay;
var height = 480;
var width = 640;
var camera, controls, scene, renderer;
var shapes = [], plane;

var offsets;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(),
offset = new THREE.Vector3(),
INTERSECTED, SELECTED;
var screenCamera;

function start() {
  glcanvas = document.getElementById("glcanvas");
  canvas2d = document.getElementById("canvas2d");
  overlay = document.getElementById("overlay");
  context = canvas2d.getContext("2d");
  
  offsets = glcanvas.getBoundingClientRect();

  // Initialize the GL context
  gl = initWebGL(glcanvas);
  init();
  animate();
  
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

function Shape(type, location, radius, ambient, diffuse, specular, color, reflective, reflectivity, refractive, refractiveVal) {
	this.type = type;
	this.location = location;
	this.radius = radius;
	this.diffuse = diffuse;
	this.specular = specular;
	this.ambient = ambient;
	this.color = color;
	this.reflective = reflective;
	this.refractive = refractive;
	this.reflectivity = reflectivity; //lower number means more reflective
	this.refractiveVal = refractiveVal;
}

function Square(p1,p2,p3,p4, ambient, diffuse, specular, color, reflective, reflectivity, refractive, refractiveVal) {
	this.type = "POLYGON";
	this.point1 = p1;
	this.point2 = p2;
	this.point3 = p3;
	this.point4 = p4;
	this.diffuse = diffuse;
	this.specular = specular;
	this.ambient = ambient;
	this.color = color;
	this.reflective = reflective;
	this.refractive = refractive;
	this.reflectivity = reflectivity; //lower number means more reflective
	this.refractiveVal = refractiveVal;
	this.plane = generatePlane(this.point1,this.point2,this.point3);
}


function Polygon(p1,p2,p3, ambient, diffuse, specular, color, reflective, reflectivity, refractive, refractiveVal) {
	this.type = "POLYGON";
	this.point1 = p1;
	this.point2 = p2;
	this.point3 = p3;
	this.diffuse = diffuse;
	this.specular = specular;
	this.ambient = ambient;
	this.color = color;
	this.reflective = reflective;
	this.refractive = refractive;
	this.reflectivity = reflectivity; //lower number means more reflective
	this.refractiveVal = refractiveVal;
	this.plane = generatePlane(this.point1,this.point2,this.point3);
}

function initWebGL(canvas) {
  gl = null;
  objects = [];
  try {
	  
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	//initialize the default objects
	var sphere = new Shape("SPHERE",[0,0,0],50,[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1],[1,255,1],0,0, 0,0);
	var sphere2 = new Shape("SPHERE",[400,100,500],50,[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1], [1,255,1],1,1, 0, 0);
	var sphere3 = new Shape("SPHERE",[450,450,900],20,[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1], [1,255,1],1,1, 0,0);
	var plane = new Shape;
	plane.plane = [-1,0,0,455];
	plane.diffuse = [0.8,0.8,0.8];
	plane.specular = [1,1,1];
	plane.ambient = [0.3,0.3,0.3];
	plane.color = [255,1,1];
	plane.reflective = 1;
	plane.refractive = 0;
	plane.reflectivity = 1;
	plane.type = "PLANE";
	
	
	var triangle = new Shape;
	triangle.point1 = [0,0,0];
	triangle.point2 = [200,10,55];
	triangle.point3 = [300,200,200];
	triangle.type = "POLYGON";
	triangle.diffuse = [0.8,0.8,0.8];
	triangle.specular = [1,1,1];
	triangle.ambient = [0.2,0.2,0.2];
	triangle.color = [1,1,255];
	triangle.reflective = 1;
	triangle.refractive = 0;
	triangle.reflectivity = 1;
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

function startFunction()
{
	var actionButton = document.getElementById('startButton');
	if(actionButton.className === "raytrace")
	{
		actionButton.className = "Setup";
		actionButton.innerHTML = "Set Environment";
		overlay.style.zIndex = "3";
		startWorker();
	}
	else
	{
		actionButton.className = "raytrace";
		actionButton.innerHTML = "RayTrace";
		canvas2d.style.zIndex = "1";
		glcanvas.style.zIndex = "2";
	}
}

function createObjectList(objects)
{
	var plane2 = new Shape;
	plane2.plane = [-1,0,0,100];
	plane2.diffuse = [0.8,0.8,0.8];
	plane2.specular = [1,1,1];
	plane2.ambient = [0.3,0.3,0.3];
	plane2.color = [255,1,1];
	plane2.reflective = 1;
	plane2.refractive = 0;
	plane2.reflectivity = 1;
	plane2.type = "PLANE";
	objects.push(plane2);
				
	for(var i = 0; i < shapes.length; i++)
	{
		if(shapes[i].type === "SPHERE")
		{
			var a = shapes[i];
			var sphere = new Shape("SPHERE",[ -a.position.y,a.position.x,a.position.z],
			a.radius,[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1],a.color,1,2, 0,0);
			objects.push(sphere);
		}
		if(shapes[i].type === "PLANE")
		{
			var a = shapes[i];
			var plane = new Shape;
			plane.plane = [-1,0,,0,-i.y];
			plane.diffuse = [0.8,0.8,0.8];
			plane.specular = [1,1,1];
			plane.ambient = [0.3,0.3,0.3];
			plane.color = [255,1,1];
			plane.reflective = 1;
			plane.refractive = 0;
			plane.reflectivity = 1;
			plane.type = "PLANE";
			objects.push(plane);
		}
		if(shapes[i].type === "SQUARE")		{
			createSquarePolygons(shapes[i].position, shapes[i].width, shapes[i].color, objects);			
		}		
		if(shapes[i].type === "PYRAMID"){			
			createPyramidPolygons(shapes[i].position, shapes[i].height, shapes[i].width, shapes[i].color, objects);
		}
	}
	
}

//add the polygons required to make a cube
function createSquarePolygons(p,w,color,obj)
{
	
	var sideA = new Square([-((p.y)+(w/2)),(p.x+(w/2)),(p.z+(w/2))],[-((p.y)+(w/2)),(p.x+(w/2)),(p.z-(w/2))],
							[-((p.y)-(w/2)),(p.x+(w/2)),(p.z-(w/2))],[-((p.y)+(w/2)),(p.x+(w/2)),(p.z+(w/2))],
			[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1],color,0,0, 0,0);
	var sideB = new Square([-((p.y)-(w/2)),(p.x-(w/2)),(p.z-(w/2))],[-((p.y)-(w/2)),(p.x-(w/2)),(p.z+(w/2))],
							[-((p.y)-(w/2)),(p.x+(w/2)), (p.z+(w/2))],[-((p.y)-(w/2)),(p.x+(w/2)),(p.z-(w/2))],
			[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1],color,0,0, 0,0);
	var sideC = new Square([-((p.y)+(w/2)),(p.x+(w/2)),(p.z-(w/2))],[-((p.y)+(w/2)),(p.x-(w/2)),(p.z-(w/2))],
							[-((p.y)-(w/2)),(p.x-(w/2)),(p.z-(w/2))],[-((p.y)-(w/2)),(p.x+(w/2)),(p.z-(w/2))],
			[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1],color,0,0, 0,0);
	var sideD = new Square([-((p.y)+(w/2)),(p.x+(w/2)),(p.z-(w/2))],[-((p.y)+(w/2)),(p.x+(w/2)),(p.z+(w/2))],
							[-((p.y)+(w/2)),(p.x-(w/2)),(p.z+(w/2))],[-((p.y)+(w/2)),(p.x-(w/2)),(p.z-(w/2))],
							[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1],color,0,0, 0,0);
	var sideE = new Square([-((p.y)+(w/2)),(p.x-(w/2)),(p.z-(w/2))],[-((p.y)+(w/2)),(p.x-(w/2)),(p.z+(w/2))],
						[-((p.y)-(w/2)),(p.x-(w/2)),(p.z+(w/2))],[-((p.y)-(w/2)),(p.x-(w/2)),(p.z-(w/2))],
			[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1],color,0,0, 0,0);
	var sideF = new Square([-((p.y)+(w/2)),(p.x-(w/2)),(p.z+(w/2))],[-((p.y)+(w/2)),(p.x+(w/2)),(p.z+(w/2))],
						[-((p.y)-(w/2)),(p.x+(w/2)),(p.z+(w/2))],[-((p.y)-(w/2)),(p.x-(w/2)),(p.z+(w/2))],
			[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1],color,0,0, 0,0);
	obj.push(sideA);
	obj.push(sideB);
	obj.push(sideC);
	obj.push(sideD);
	obj.push(sideE);
	obj.push(sideF);
}

//add the polygons required to make a cube
function createPyramidPolygons(p,h,w,color,obj)
{
	
	var distance = Math.sqrt(Math.pow(w,2) + Math.pow(w,2));
	
	alert("x: "+p.x+" , y:"+p.y+", z: "+p.z + ", distance:"+distance);
	var a = [-p.y+(h/2),p.x,p.z];
	var b = [-p.y+(h/2),p.x+distance,p.z];
	var c = [-p.y+(h/2),p.x,p.z];
	var d = [-p.y+(h/2),p.x-distance,p.z];
	var top = [-p.y-(h/2),p.x,p.z];
	
	var sideA = new Square(a,b,c,d,
			[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1],color,0,0, 0,0);
	var sideB = new Polygon(top,a,b,[0.5,0.5,0.5],[0.8,0.8,0.8],[1,1,1],color,0,0, 0,0);
	var sideC = new Polygon(top,b,c,[0.5,0.5,0.5],[0.8,0.8,0.8],[1,1,1],color,0,0, 0,0);
	var sideD = new Polygon(top,c,d,[0.2,0.2,0.2],[0.8,0.8,0.8],[1,1,1],color,0,0, 0,0);
	var sideE = new Polygon(top,d,a,[0.5,0.5,0.5],[0.8,0.8,0.8],[1,1,1],color,0,0, 0,0);
	obj.push(sideA);
	obj.push(sideB);
	obj.push(sideC);
	obj.push(sideD);
	obj.push(sideE);
}


function startWorker() {
	if(typeof(Worker) !== "undefined") {
		if(typeof(w) == "undefined") {
			w = new Worker("js/generate_image.js");
			w.postMessage = w.webkitPostMessage || w.postMessage;
			objects = [];
			createObjectList(objects);
			screenCamera = new Object();
			screenCamera.position = camera.position;
			screenCamera.direction = camera.getWorldDirection();
			screenCamera.corners = topCorners(screenCamera.position, camera, glcanvas);
			screenCamera.plane = 
			w.postMessage([JSON.stringify(objects),height,width,pixelWidth, JSON.stringify(light), 
							maxRecursions, defaultColor, JSON.stringify(screenCamera)]);
		}
		w.onmessage = function(event) {
			if(event.data.startsWith("ROW:")){
				var rows = (event.data.split("ROW:"));
				for(var i = 0; i < rows.length; i++)
				{
					var pixels = rows[i].split(',');
					var x = pixels[0];
					for(var j = 1; j < pixels.length-1; j+=3)
					{
						context.fillStyle = "rgb("+pixels[j]+","+pixels[j+1]+","+pixels[j+2]+")";
						context.fillRect(((j-1)/3)*pixelWidth, x*pixelWidth, pixelWidth, pixelWidth );
					}	
				}
				
				stopWorker();				
				overlay.style.zIndex = "0";
				canvas2d.style.zIndex = "2";
				glcanvas.style.zIndex = "1";
				
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

function addSquare()
{
	var geometry = new THREE.BoxGeometry( 40, 40, 40 );
	var tempColor = [Math.random()*256, Math.random()*256,Math.random()*256];
	
	var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: rgb2hex(tempColor[0],tempColor[1],tempColor[2])  } ) );

	object.position.x = 0;
	object.position.y = 0;
	object.position.z = 0;

	object.type = "SQUARE";
	object.width = 80;
	object.color = tempColor;
	object.scale.x = 2
	object.scale.y = 2;
	object.scale.z = 2;

	object.castShadow = true;
	object.receiveShadow = true;

	scene.add( object );

	shapes.push( object );
}

function addSphere()
{
	var geometry = new THREE.SphereGeometry( 50 );
	var tempColor = [Math.random()*256, Math.random()*256,Math.random()*256];
	var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: rgb2hex(tempColor[0],tempColor[1],tempColor[2]) } ) );

	object.position.x = 0;
	object.position.y = 0;
	object.position.z = 0;
	
	object.type = "SPHERE";
	object.radius = 50;
	
	object.color = tempColor;
	object.reflective = 0;
	object.refractive = 1;
	object.reflectivity = 0; //lower number means more reflective
	object.refractiveVal = 2.4;

	object.castShadow = true;
	object.receiveShadow = true;

	scene.add( object );
	//objects.push( object );
	shapes.push( object );
}

function rgb2hex(red, green, blue) {
	var rgb = blue | (green << 8) | (red << 16);
	return parseInt("0x"+(0x1000000 + rgb).toString(16).slice(1));
}

function addPyramid()
{
	var geometry = new THREE.CylinderGeometry( 1, 50, 80, 4 );
	var tempColor = [Math.random()*256, Math.random()*256,Math.random()*256];
	var cylinder = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: rgb2hex(tempColor[0],tempColor[1],tempColor[2])}  ));
		
	cylinder.position.x = 0;
	cylinder.position.y = 0;
	cylinder.position.z = 0;	
	
	cylinder.type = "PYRAMID";
	cylinder.width = 50;
	cylinder.height = 80;
	cylinder.color = tempColor;
		
		
	cylinder.castShadow = true;
	cylinder.receiveShadow = true;
	
	scene.add( cylinder );
	shapes.push( cylinder );
	
}

function topCorners(position, camera, canvas)
{
	var pos = position.clone();
    projScreenMat = new THREE.Matrix4();
    projScreenMat.multiplyMatrices( camera.projectionMatrix, camera.matrix);
    projScreenMat.multiplyVector3(pos);
    return { x: (pos.x+1)*width/2, 
             y:(-pos.y+1)*height/2}; 
 
}

			

			function init() {
				camera = new THREE.PerspectiveCamera( 70, width / height, 1, 10000 );
				camera.position.z = 500;

				/*controls = new THREE.TrackballControls( camera );
				controls.rotateSpeed = 1.0;
				controls.zoomSpeed = 1.2;
				controls.panSpeed = 0.8;
				controls.noZoom = false;
				controls.noPan = false;
				controls.staticMoving = true;
				controls.dynamicDampingFactor = 0.3;*/

				scene = new THREE.Scene();

				scene.add( new THREE.AmbientLight( 0x505050 ) );

				var glLight = new THREE.SpotLight( 0xffffff, 1.5 );
				glLight.position.set( 0, 500, 2000 );
				glLight.castShadow = true;

				glLight.shadowCameraNear = 200;
				glLight.shadowCameraFar = camera.far;
				glLight.shadowCameraFov = 50;

				glLight.shadowBias = -0.00022;

				glLight.shadowMapWidth = 2048;
				glLight.shadowMapHeight = 2048;

				scene.add( glLight );
			

				plane = new THREE.Mesh(
					new THREE.PlaneBufferGeometry( 2000, 2000, 8, 8 ),
					new THREE.MeshBasicMaterial( { visible: false } )
				);
				scene.add( plane );
				
				ground = new THREE.Mesh( new THREE.PlaneGeometry( 5000, 5000 ), new THREE.MeshLambertMaterial( { color: 0xff0000} ) );
				ground.position.y = -100;
				ground.type = "PLANE";
				ground.rotation.set(-Math.PI/2, Math.PI/2000, Math.PI); 
				ground.castShadow = true;
				ground.receiveShadow = true;
				scene.add(ground);
				
				


				renderer = new THREE.WebGLRenderer( { antialias: true, canvas: glcanvas } );
				renderer.setSize(700, 700);
				renderer.setClearColor( 0xf0f0f0 );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( width, height );
				renderer.sortObjects = false;

				renderer.shadowMap.enabled = true;
				renderer.shadowMap.type = THREE.PCFShadowMap;

				renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
				renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
				renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );

			}

			function onDocumentMouseMove( event ) {

				event.preventDefault();
				mouse.x = ( (event.clientX-offsets.left) / width ) * 2 - 1;
				mouse.y = - ( (event.clientY-offsets.top) / height ) * 2 + 1;
				
				raycaster.setFromCamera( mouse, camera );

				if ( SELECTED ) {

					var intersects = raycaster.intersectObject( plane );

					if ( intersects.length > 0 ) {

						SELECTED.position.copy( intersects[ 0 ].point.sub( offset ) );

					}

					return;

				}

				var intersects = raycaster.intersectObjects( shapes );

				if ( intersects.length > 0 ) {

					if ( INTERSECTED != intersects[ 0 ].object ) {

						if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

						INTERSECTED = intersects[ 0 ].object;
						INTERSECTED.currentHex = INTERSECTED.material.color.getHex();

						plane.position.copy( INTERSECTED.position );
						plane.lookAt( camera.position );

					}

					glcanvas.style.cursor = 'pointer';

				} else {

					if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

					INTERSECTED = null;

					glcanvas.style.cursor = 'auto';

				}

			}

			function onDocumentMouseDown( event ) {

				event.preventDefault();

				raycaster.setFromCamera( mouse, camera );

				var intersects = raycaster.intersectObjects( shapes );

				if ( intersects.length > 0 ) {

					//controls.enabled = false;

					SELECTED = intersects[ 0 ].object;

					/*var intersects = raycaster.intersectObject( plane );

					if ( intersects.length > 0 ) {

						offset.copy( intersects[ 0 ].point ).sub( plane.position );

					}*/

					glcanvas.style.cursor = 'move';

				}

			}

			function onDocumentMouseUp( event ) {

				event.preventDefault();

				//controls.enabled = true;

				if ( INTERSECTED ) {

					plane.position.copy( INTERSECTED.position );

					SELECTED = null;

				}

				glcanvas.style.cursor = 'auto';

			}

			function animate() {

				requestAnimationFrame( animate );
				render();

			}

			function render() {

				//controls.update();

				renderer.render( scene, camera );

			}
