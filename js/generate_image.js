var height;
var width;
var r0;
var objects;
var pixelWidth;
var pixelCenter;
var TIRflag = -999.0;
var scalefac = 16384;
var light;	
var maxRecursions;
var defaultColor;
var camera;

//iterate through each pixel to get the raytraced colour
function RayTrace()
{
	
	r0 = [camera.position.x-(camera.direction.x*10),
			camera.position.y-(camera.direction.y*10),
			-(camera.position.z - (camera.direction.z*100) )];
	var row = ""; 	
	
	for(var i = 0; i < height; i+=pixelWidth)
	{
		row += "ROW:"+i/pixelWidth+",";
		for(var j = 0; j < width; j+=pixelWidth)
		{
			row += GetColor(r0,calculateDirection(i-camera.corners.y+pixelCenter,
			j-camera.corners.x+pixelCenter), 0) + ",";
		}
	}
	postMessage(row);
}

function checkForHit(vectorStart, vectorSlope, object)
{	
	var intersection = -1;
	var point;
	var normal;
	var minDistance;
	var obj;
	var color = defaultColor; 
	var reflection;
	
	for(var index = 0; index < objects.length; index++)
	{		
		if(objects[index].type === "SPHERE")
		{		
			var B = CalculateB(vectorStart, vectorSlope, objects[index].location);
			var C = CalculateC(vectorStart, objects[index].location, objects[index].radius);
			var temp = (Math.pow(B,2) - 4*C);
			
			if(temp >= 0)
			{
				var t = (-B - Math.sqrt(temp))/2;
				if(t <= 0)	t = (-B + Math.sqrt(temp))/2;
				if(t <= 0) continue;
				
				var distance = Distance(vectorStart, vectorSlope, t);
				
				if((!minDistance || distance < minDistance))
				{
					minDistance = distance;
					obj = objects[index];
				}				
			}
		}
		else if(objects[index].type === "PLANE")
		{
			//check for plane intersection
			var direction = objects[index].plane[0] * vectorSlope[0] +
							objects[index].plane[1] * vectorSlope[1] +
							objects[index].plane[2] * vectorSlope[2];
							
			if(direction < 0)
			{
				var d2 = objects[index].plane[0] * vectorStart[0] +
							objects[index].plane[1] * vectorStart[1] +
							objects[index].plane[2] * vectorStart[2];
							
				var t = -(d2+objects[index].plane[3])/direction;
				if(t < 0) continue;
				
				var distance = Distance(vectorStart, vectorSlope, t);
				
				if((!minDistance || distance < minDistance))
				{
					minDistance = distance;
					obj = objects[index];
				}	
			}
		}
		
		else if(objects[index].type === "POLYGON")
		{
			var direction = objects[index].plane[0] * vectorSlope[0] +
							objects[index].plane[1] * vectorSlope[1] +
							objects[index].plane[2] * vectorSlope[2];
							
			if(direction < 0)
			{
				var d2 = objects[index].plane[0] * vectorStart[0] +
							objects[index].plane[1] * vectorStart[1] +
							objects[index].plane[2] * vectorStart[2];
							
				var t = -(d2+objects[index].plane[3])/direction;
				if(t < 0) continue;
				
				var distance = Distance(vectorStart, vectorSlope, t);
				var Hitpoint = [(vectorStart[0] + vectorSlope[0]*t), (vectorStart[1] + vectorSlope[1]*t), (vectorStart[2] + vectorSlope[2]*t)];
				
				var inside;
				if(objects[index].point4)
				{
					inside = pointInside(objects[index].point1,objects[index].point2,objects[index].point3,Hitpoint) ||
								pointInside(objects[index].point3,objects[index].point4,objects[index].point1,Hitpoint);
				}else
					inside = pointInside(objects[index].point1,objects[index].point2,objects[index].point3,Hitpoint);
				
				if((!minDistance || distance < minDistance) && inside)
				{
					minDistance = distance;
					obj = objects[index];
				}	
			}			
		}
		else if(objects[index].type === "CYLINDER")
		{
			var a = Math.pow(vectorSlope[0],2) + Math.pow(vectorSlope[2],2);
			var b = 2 * vectorStart[0] * vectorSlope[0] + 2 * vectorStart[2] * vectorSlope[2];
			var c = Math.pow(vectorStart[0],2) + Math.pow(vectorStart[2],2) - 1;
			var t0;
			var t1;
			var normal

			var value = b*b - 4*a*c;
			if (value<0)
				continue;
				
			var val2 = Math.sqrt(value);
			t0 = (-b + val2) / (2 * a);
			t1 = (-b - val2) / (2 * a);			
			
			//order the values
			if (t0>t1){
				var tmp = t0;
				t0=t1;
				t1=tmp;
			}
			var y0 = vectorStart[1] + t0 * vectorSlope[1];
			var y1 = vectorStart[1] + t1 * vectorSlope[1];
			
			if (y0<-0)
			{
				if (y1<0)
					continue;
				else
				{
					// hit the cap
					var th = t0 + (t1-t0) * (y0+1) / (y0-y1);
					if (th<=0) continue;
				
					var distance = Distance(vectorStart, vectorSlope, th);
					if((!minDistance || distance < minDistance) && inside)
					{
						minDistance = distance;
						obj = objects[index];
					}	
				}
			}
			else if (y0>=0 && y0<=objects[index].radius)
			{
				// hit the cylinder bit
				if (t0<=0) continue;
					
				var distance = Distance(vectorStart, vectorSlope, t0);
					if((!minDistance || distance < minDistance) && inside)
					{
						minDistance = distance;
						obj = objects[index];
					}	
			return true;
			}
			else if (y0>objects[index].radius)
			{
				if (y1>objects[index].radius)
					continue;
				else
				{
					// hit the cap
					var th = t0 + (t1-t0) * (y0-1) / (y0-y1);
					if (th<=0) continue;

					var distance = Distance(vectorStart, vectorSlope, th);
					if((!minDistance || distance < minDistance) && inside)
					{
						minDistance = distance;
						obj = objects[index];
					}	
				}
			}
		}
	}	
	
	return (obj === object);
}


function GetColor(vectorStart, vectorSlope, recursion, object)
{	
	var intersection = -1;
	var point;
	var normal;
	var minDistance;
	var obj;
	var color = defaultColor; 
	var reflection;
	
	for(var index = 0; index < objects.length; index++)
	{
		if (object && object === objects[index]) continue;
		
		if(objects[index].type === "SPHERE")
		{
			var B = CalculateB(vectorStart, vectorSlope, objects[index].location);
			var C = CalculateC(vectorStart, objects[index].location, objects[index].radius);
			var temp = (Math.pow(B,2) - 4*C);
			
			if(temp >= 0)
			{
				var t = (-B - Math.sqrt(temp))/2;
				if(t <= 0)	t = (-B + Math.sqrt(temp))/2;
				if(t <= 0) continue;
				
				var distance = Distance(vectorStart, vectorSlope, t);
				
				if((!minDistance || distance < minDistance))
				{
					minDistance = distance;
					obj = objects[index];
					point = [(vectorStart[0] + vectorSlope[0]*t), (vectorStart[1] + vectorSlope[1]*t), (vectorStart[2] + vectorSlope[2]*t)];
					normal = [(point[0]-objects[index].location[0])/objects[index].radius,
								(point[1]-objects[index].location[1])/objects[index].radius,
								(point[2]-objects[index].location[2])/objects[index].radius];
					reflection = CalculateReflection(vectorSlope, normal);
					color = calculateColor(objects[index], normal, point, reflection);
				}				
			}
		}
		else if(objects[index].type === "PLANE")
		{
			//check for plane intersection
			var direction = objects[index].plane[0] * vectorSlope[0] +
							objects[index].plane[1] * vectorSlope[1] +
							objects[index].plane[2] * vectorSlope[2];
							
			if(direction < 0)
			{
				var d2 = objects[index].plane[0] * vectorStart[0] +
							objects[index].plane[1] * vectorStart[1] +
							objects[index].plane[2] * vectorStart[2];
							
				var t = -(d2+objects[index].plane[3])/direction;
				if(t < 0) continue;
				
				var distance = Distance(vectorStart, vectorSlope, t);
				
				if((!minDistance || distance < minDistance))
				{
					minDistance = distance;
					obj = objects[index];
					point = [(vectorStart[0] + vectorSlope[0]*t), (vectorStart[1] + vectorSlope[1]*t), (vectorStart[2] + vectorSlope[2]*t)];
					normal = [objects[index].plane[0],
								objects[index].plane[1],
								objects[index].plane[2]];
								
					reflection = CalculateReflection(vectorSlope, normal);	
					color = calculateColor(objects[index], normal, point, reflection);
				}	
			}
		}
		
		else if(objects[index].type === "POLYGON")
		{
			//calculate polygon intersection
			var direction = objects[index].plane[0] * vectorSlope[0] +
							objects[index].plane[1] * vectorSlope[1] +
							objects[index].plane[2] * vectorSlope[2];
							
			if(direction < 0)
			{
				var d2 = objects[index].plane[0] * vectorStart[0] +
							objects[index].plane[1] * vectorStart[1] +
							objects[index].plane[2] * vectorStart[2];
							
				var t = -(d2+objects[index].plane[3])/direction;
				if(t < 0) continue;
				
				var distance = Distance(vectorStart, vectorSlope, t);
				var Hitpoint = [(vectorStart[0] + vectorSlope[0]*t), (vectorStart[1] + vectorSlope[1]*t), (vectorStart[2] + vectorSlope[2]*t)];
				
				var inside;
				if(objects[index].point4)
				{
					inside = pointInside(objects[index].point1,objects[index].point2,objects[index].point3,Hitpoint) ||
								pointInside(objects[index].point3,objects[index].point4,objects[index].point1,Hitpoint);
				}else
					inside = pointInside(objects[index].point1,objects[index].point2,objects[index].point3,Hitpoint);
				
				if((!minDistance || distance < minDistance) && inside)
				{
					minDistance = distance;
					obj = objects[index];
					point = [(vectorStart[0] + vectorSlope[0]*t), (vectorStart[1] + vectorSlope[1]*t), (vectorStart[2] + vectorSlope[2]*t)];
					normal = [objects[index].plane[0],
								objects[index].plane[1],
								objects[index].plane[2]];
					
					reflection = CalculateReflection(vectorSlope, normal);			
					color = calculateColor(objects[index], normal, point, reflection);
				}	
			}			
		}
		else if(objects[index].type === "CYLINDER")
		{
			var a = Math.pow(vectorSlope[0],2) + Math.pow(vectorSlope[2],2);
			var b = 2 * vectorStart[0] * vectorSlope[0] + 2 * vectorStart[2] * vectorSlope[2];
			var c = Math.pow(vectorStart[0],2) + Math.pow(vectorStart[2],2) - 1;
			var t0;
			var t1;
			var tempnormal;
			var tempt;

			var value = b*b - 4*a*c;
			if (value<0)
				continue;
				
			var val2 = Math.sqrt(value);
			t0 = (-b + val2) / (2 * a);
			t1 = (-b - val2) / (2 * a);			
			
			//order the values
			if (t0>t1){
				var tmp = t0;
				t0=t1;
				t1=tmp;
			}
			var y0 = vectorStart[1] + t0 * vectorSlope[1];
			var y1 = vectorStart[1] + t1 * vectorSlope[1];
			
			if (y0<0)
			{
				if (y1<0)
					continue;
				else
				{
					// hit the cap
					var th = t0 + (t1-t0) * (y0+1) / (y0-y1);
					if (th<=0) continue;
				
					tempt = th;
					tempnormal = [0, -1, 0];
				}
			}
			else if (y0>=0 && y0<=objects[index].radius)
			{
				// hit the cylinder bit
				if (t0<=0) continue;
					
				tempt = t0;
				tempHit = [(vectorStart[0] + vectorSlope[0]*tempt), (vectorStart[1] + vectorSlope[1]*tempt), (vectorStart[2] + vectorSlope[2]*tempt)];
				tempnormal = [tempHit[0], 0, tempHit[2]];
				var l = length(tempnormal);
				tempnormal = [tempnormal[0]/l, 0, tempnormal[2]/l];
			return true;
			}
			else if (y0>objects[index].radius)
			{
				if (y1>objects[index].radius)
					continue;
				else
				{
					// hit the cap
					var th = t0 + (t1-t0) * (y0-1) / (y0-y1);
					if (th<=0) continue;

					tempt = th;
					tempnormal = [0, 1, 0];
				}
			}
						
			if(tempt)
			{
				var distance = Distance(vectorStart, vectorSlope, tempt);
				if((!minDistance || distance < minDistance))
				{
					tempt = t;
					minDistance = distance;
					obj = objects[index];
					point = [(vectorStart[0] + vectorSlope[0]*t), (vectorStart[1] + vectorSlope[1]*t), (vectorStart[2] + vectorSlope[2]*t)];
					normal = tempnormal;
					
					reflection = CalculateReflection(vectorSlope, normal);			
					color = calculateColor(objects[index], normal, point, reflection);
				}
			}
		}
	}	
	
	//set the reflective colour
	if(obj && obj.reflective==1 && (recursion+1) <= maxRecursions)
	{
		recursedColor = (GetColor(point, reflection, recursion+1, obj));
		color = [	Math.round((obj.reflectivity*color[0] + recursedColor[0]) /(1+obj.reflectivity)),
					Math.round((obj.reflectivity*color[1] + recursedColor[1]) /(1+obj.reflectivity)),
					Math.round((obj.reflectivity*color[2] + recursedColor[2]) /(1+obj.reflectivity))	];
					
	}
	
	//set the refractive color
	if(obj && obj.refractive==1 && recursion+1 <= maxRecursions)
	{
		var refraction = CalculateRefraction(vectorSlope, normal, (object)?object.refractiveVal:1, (obj.refractiveVal)?obj.refractiveVal:1);
		refractedColor = (GetColor(point, refraction, recursion+1, obj));
		color = [	Math.round((color[0] + 3*refractedColor[0]) /(4)),
					Math.round((color[1] + 3*refractedColor[1]) /(4)),
					Math.round((color[2] + 3*refractedColor[2]) /(4))	];
					
	}
	
	return color;
}

function sameObject(a, b)
{
	if(a && b)
		return (a.location[0] == b.location[0] && a.location[1] == b.location[1] && a.location[2] == b.location[2])
	return false;
}

function calculateColor(object, normal, hitpoint, reflection)
{		
	var ambientVal = [	light.ambientI*object.ambient[0],
					light.ambientI*object.ambient[1],
					light.ambientI*object.ambient[2]];
					
	var v = [light.location[0]- hitpoint[0],
						light.location[1]- hitpoint[1],
						light.location[2]- hitpoint[2]];				
	
	var li = light.lightI;
	if(!checkForHit(light.location, [-v[0]/length(v),-v[1]/length(v),-v[2]/length(v)], object))
	{
		li = 0;
	}
	
	var cosA = 	(dot(v,normal))/(length(v)*length(normal));
	var cosB = (dot(reflection,v))/(length(reflection)*length(v));
	
	return  [ 	Math.round(object.color[0]*(ambientVal[0] + li*(object.diffuse[0]*cosA + object.specular[0]*Math.pow(cosB, light.specularF)))),
				Math.round(object.color[1]*(ambientVal[1] + li*(object.diffuse[1]*cosA + object.specular[1]*Math.pow(cosB, light.specularF) ))),
				Math.round(object.color[2]*(ambientVal[2] + li*(object.diffuse[2]*cosA + object.specular[2]*Math.pow(cosB, light.specularF) ))) ];
	
}


function dot(a,b)
{
	return (a[0]*b[0] + a[1]*b[1] + a[2]*b[2]);	
}

function length(vector)
{
	return (Math.sqrt(Math.pow(vector[0],2) + Math.pow(vector[1],2) + Math.pow(vector[2],2)));
}

function strip(number) {
    return (parseFloat(number).toPrecision(10));
}

function pointInside(p1,p2,p3,p)
{
	var b1, b2, b3;

    b1 = sign(p, p1, p2) < 0;
    b2 = sign(p, p2, p3) < 0;
    b3 = sign(p, p3, p1) < 0;

    return ((b1 == b2) && (b2 == b3));
}

function sign (p1, p2, p3)
{
    return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
}

//calculate the distance between 2 points
function Distance(vectorStart, vectorSlope, t){
	return (Math.pow((vectorStart[0] + vectorSlope[0]*t)-vectorStart[0],2)+
			Math.pow((vectorStart[1] + vectorSlope[1]*t)-vectorStart[1],2)+
			Math.pow((vectorStart[2] + vectorSlope[2]*t)-vectorStart[2],2));
}

//one of the equations used in the sphere intersection calculation
function CalculateB(start, slope, sphere)
{
	return (2*(slope[0]*(start[0]-sphere[0])+ 
				slope[1]*(start[1]-sphere[1])+ 
				slope[2]*(start[2]-sphere[2])));
}

//return the direction vector of the reflection
function CalculateReflection(vector, normal)
{
	var value = dot(vector, normal);	
	return [vector[0] - 2*(value)*normal[0],
			vector[1] - 2*(value)*normal[1],
			vector[2] - 2*(value)*normal[2]];
}

//return the direction vector of the reflection
function CalculateRefraction(vector, normal, startk, endk)
{
	var value = dot(vector, normal);
	var beta;
	var alpha;
	var r = startk/endk;
	var D;
	
    if (value>=0) { 
		beta=r; 
	} else {
		beta=1/r;
	}
	
    D = 1 + Math.pow(beta,2)*(Math.pow(value,2) - 1);

    if (D>=0) {
        if (value >= 0)
            alpha = beta * value - Math.sqrt(D); 
        else
			alpha = beta * value + Math.sqrt(D); 
        return[ alpha*normal[0] - beta*vector[0],
				alpha*normal[1] - beta*vector[1],
				alpha*normal[2] - beta*vector[2]];
    } else {
        value = 2 * value;       
		return [ value * normal[0] - vector[0],
				value * normal[1] - vector[1],
				value * normal[2] - vector[2]];		
    }
	
}

function CalculateC(start, sphere, radius)
{
	return (Math.pow(start[0]-sphere[0],2)+
			Math.pow(start[1]-sphere[1],2)+ 
			Math.pow(start[2]-sphere[2],2)- 
			Math.pow(radius,2));
}

//calculate the direction vector from the eye to the pixel
function calculateDirection(i,j)
{
	//calculate the direction vector
	var direction = [i-r0[0], j-r0[1],0-r0[2]];
	
	//normalize and return the direction vector
	var magnitude = Math.sqrt(Math.pow(direction[0],2)+Math.pow(direction[1],2)+Math.pow(direction[2],2));
	return [direction[0]/magnitude, direction[1]/magnitude, direction[2]/magnitude];	
}


onmessage = function(e)
{
	objects = JSON.parse(e.data[0]);
	height = e.data[1];
	width = e.data[2];
	pixelWidth = e.data[3];
	light = JSON.parse(e.data[4]);
	maxRecursions = e.data[5];
	defaultColor = e.data[6];
	camera = JSON.parse(e.data[7]);
	pixelCenter = pixelWidth/2;
	RayTrace();
}