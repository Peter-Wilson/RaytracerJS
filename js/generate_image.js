var h;
var w;
var r0;

//iterate through each pixel to get the raytraced colour
function Start(width, height)
{
	h = height;
	w = width;
	r0 = [width/2,height/2,-500];
	
	RayTrace(0,0);
}

function RayTrace(i,j)
{
	//raytrace for a pixel
	var PixelColor = GetColor(i,j);
	
	//row completed
	if(j > width){
		j = 0;
		i++;
	}else
		j++;
	
	//image processed
	if(i > height) return;
	
	setTimeout("RayTrace("+i+","+j+")",5);
	
}

function GetColor(i, j)
{
	var ray;
	var rD = calculateDirection(i,j);
	postmessage("output:"+"\nValue = "+rD[0]);
	
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

/*
var RayTrace( rvec, rec_depth){ 
	var color = '#';
	if (rec_depth > MAX DEPTH) 
		colour += "FFFFFF"; 
	else { 
	if RayIntersection (rvec, hitobj, hitpt, hitnorm) { 
		local colour = shade(hitobj, hitpt, hitnorm) 
		if has refl(hitobj) { 
			refl vec = calc reflection(rvec, hitobj, hitpt, hitnorm); 
			reflect colour = RayTrace((hitpt, refl vec), rec depth+1) 
		} // if 
		if has trans(hitobj) { 
			trans vec = calc transmission(rvec, hitobj, hitpt, hitnorm) 
			trans colour = RayTrace((hitpt, trans vec), rec depth+1) 
		} // if 
		colour = local colour + reflect colour + trans colour 
	} // if 
	else 
		colour = background colour 
	} // else 
	return ( colour ) 
} // program
*/

Start(640,480);